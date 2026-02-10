import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type HabitId = Text;
  type Date = Text; // Using Text for date representation (YYYY-MM-DD)

  public type Category = {
    #work;
    #hobby;
    #health;
    #exercise;
    #education;
    #social;
    #finance;
    #miscellaneous;
  };

  public type Habit = {
    id : HabitId;
    name : Text;
    color : Text;
    createdAt : Date;
    category : Category;
  };

  public type Completion = {
    habitId : HabitId;
    date : Date;
    completed : Bool;
  };

  public type UserProfile = {
    displayName : Text;
  };

  // Helper function to generate unique HabitId
  func generateHabitId(name : Text) : HabitId {
    let timestamp = debug_show (Time.now());
    name # timestamp;
  };

  // Helper function to get current date in YYYY-MM-DD format
  func getCurrentDate() : Date {
    // This is a placeholder. In practice, you'd convert Time.now() to a date string.
    debug_show (Time.now());
  };

  let users = Map.empty<Principal, UserProfile>();
  let userHabits = Map.empty<Principal, Map.Map<HabitId, Habit>>();
  let userCompletions = Map.empty<Principal, Map.Map<HabitId, List.List<Completion>>>();

  // Get caller's user profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    users.get(caller);
  };

  // Get another user's profile (admin only or own profile)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  // Save caller's user profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  // Update user display name (legacy support)
  public shared ({ caller }) func setDisplayName(displayName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set display name");
    };
    let profile : UserProfile = { displayName };
    users.add(caller, profile);
  };

  // Retrieve user display name (legacy support)
  public query ({ caller }) func getDisplayName() : async ?Text {
    switch (users.get(caller)) {
      case (null) { null };
      case (?profile) { ?profile.displayName };
    };
  };

  // Create new habit
  public shared ({ caller }) func createHabit(name : Text, color : Text, category : Category) : async HabitId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create habits");
    };

    let id = generateHabitId(name);
    let habit : Habit = {
      id;
      name;
      color;
      createdAt = getCurrentDate();
      category;
    };

    var userHabitsMap = switch (userHabits.get(caller)) {
      case (null) { Map.empty<HabitId, Habit>() };
      case (?h) { h };
    };

    userHabitsMap.add(id, habit);
    userHabits.add(caller, userHabitsMap);

    var userCompletionsMap = switch (userCompletions.get(caller)) {
      case (null) { Map.empty<HabitId, List.List<Completion>>() };
      case (?c) { c };
    };

    userCompletionsMap.add(id, List.empty<Completion>());
    userCompletions.add(caller, userCompletionsMap);

    id;
  };

  // Update habit details
  public shared ({ caller }) func updateHabit(id : HabitId, name : Text, color : Text, category : Category) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update habits");
    };

    switch (userHabits.get(caller)) {
      case (null) { false };
      case (?userHabitsMap) {
        switch (userHabitsMap.get(id)) {
          case (null) { false };
          case (?existingHabit) {
            let updatedHabit : Habit = {
              id;
              name;
              color;
              createdAt = existingHabit.createdAt;
              category;
            };
            userHabitsMap.add(id, updatedHabit);
            userHabits.add(caller, userHabitsMap);
            true;
          };
        };
      };
    };
  };

  // Mark habit completion for a specific date
  public shared ({ caller }) func markCompletion(habitId : HabitId, date : Date, completed : Bool) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark completions");
    };

    switch (userCompletions.get(caller)) {
      case (null) { false };
      case (?userCompletionsMap) {
        switch (userCompletionsMap.get(habitId)) {
          case (null) { false };
          case (?existingCompletions) {
            let completion : Completion = {
              habitId;
              date;
              completed;
            };
            var updatedCompletions = existingCompletions;
            updatedCompletions.add(completion);
            userCompletionsMap.add(habitId, updatedCompletions);
            userCompletions.add(caller, userCompletionsMap);
            true;
          };
        };
      };
    };
  };

  // Get all habits for the caller
  public query ({ caller }) func getHabits() : async [Habit] {
    // Guests can query but will get empty results since they can't create habits
    switch (userHabits.get(caller)) {
      case (null) { [] };
      case (?userHabitsMap) { userHabitsMap.values().toArray() };
    };
  };

  // Get completions for a specific habit
  public query ({ caller }) func getHabitCompletions(habitId : HabitId) : async [Completion] {
    // Guests can query but will get empty results since they can't create habits
    switch (userCompletions.get(caller)) {
      case (null) { [] };
      case (?userCompletionsMap) {
        switch (userCompletionsMap.get(habitId)) {
          case (null) { [] };
          case (?completionList) { completionList.toArray() };
        };
      };
    };
  };

  // Delete a habit
  public shared ({ caller }) func deleteHabit(habitId : HabitId) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete habits");
    };

    switch (userHabits.get(caller)) {
      case (null) { false };
      case (?userHabitsMap) {
        userHabitsMap.remove(habitId);
        userHabits.add(caller, userHabitsMap);

        // Also remove completions for this habit
        switch (userCompletions.get(caller)) {
          case (null) { false };
          case (?userCompletionsMap) {
            userCompletionsMap.remove(habitId);
            userCompletions.add(caller, userCompletionsMap);
            true;
          };
        };
      };
    };
  };
};
