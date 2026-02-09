import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type HabitId = Text;
  type Date = Text; // Using Text for date representation (YYYY-MM-DD)

  type Habit = {
    id : HabitId;
    name : Text;
    color : Text;
    createdAt : Date;
  };

  type Completion = {
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

  stable var users : Map.Map<Principal, UserProfile> = Map.empty();
  stable var userHabits : Map.Map<Principal, Map.Map<HabitId, Habit>> = Map.empty();
  stable var userCompletions : Map.Map<Principal, Map.Map<HabitId, List.List<Completion>>> = Map.empty();

  // Get caller's user profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access profiles");
    };
    users.get(caller);
  };

  // Get another user's profile (admin only or own profile)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  // Save caller's user profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    users.add(caller, profile);
  };

  // Update user display name (legacy support)
  public shared ({ caller }) func setDisplayName(displayName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can set display names");
    };
    let profile : UserProfile = { displayName };
    users.add(caller, profile);
  };

  // Retrieve user display name (legacy support)
  public query ({ caller }) func getDisplayName() : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get display names");
    };
    switch (users.get(caller)) {
      case (null) { null };
      case (?profile) { ?profile.displayName };
    };
  };

  // Create new habit
  public shared ({ caller }) func createHabit(name : Text, color : Text) : async HabitId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create habits");
    };

    let id = generateHabitId(name);
    let habit : Habit = {
      id;
      name;
      color;
      createdAt = getCurrentDate();
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
  public shared ({ caller }) func updateHabit(id : HabitId, name : Text, color : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update habits");
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
      Runtime.trap("Unauthorized: Only authenticated users can mark completions");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get habits");
    };

    switch (userHabits.get(caller)) {
      case (null) { [] };
      case (?userHabitsMap) { userHabitsMap.values().toArray() };
    };
  };

  // Get completions for a specific habit
  public query ({ caller }) func getHabitCompletions(habitId : HabitId) : async [Completion] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get completions");
    };

    switch (userCompletions.get(caller)) {
      case (null) { [] };
      case (?userCompletionsMap) {
        switch (userCompletionsMap.get(habitId)) {
          case (null) { [] };
          case (?completionList) {
            completionList.toArray();
          };
        };
      };
    };
  };

  // Delete a habit
  public shared ({ caller }) func deleteHabit(habitId : HabitId) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete habits");
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
