import Map "mo:core/Map";
import Principal "mo:core/Principal";
import List "mo:core/List";

module {
  type OldHabit = {
    id : Text;
    name : Text;
    color : Text;
    createdAt : Text;
  };

  type OldActor = {
    users : Map.Map<Principal, {
      displayName : Text;
    }>;
    userHabits : Map.Map<Principal, Map.Map<Text, OldHabit>>;
    userCompletions : Map.Map<Principal, Map.Map<Text, List.List<{
      habitId : Text;
      date : Text;
      completed : Bool;
    }>>>;
  };

  type Category = {
    #work;
    #hobby;
    #health;
    #exercise;
    #education;
    #social;
    #finance;
    #miscellaneous;
  };

  type NewActor = {
    users : Map.Map<Principal, {
      displayName : Text;
    }>;
    userHabits : Map.Map<Principal, Map.Map<Text, {
      id : Text;
      name : Text;
      color : Text;
      createdAt : Text;
      category : Category;
    }>>;
    userCompletions : Map.Map<Principal, Map.Map<Text, List.List<{
      habitId : Text;
      date : Text;
      completed : Bool;
    }>>>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserHabits = old.userHabits.map<Principal, Map.Map<Text, OldHabit>, Map.Map<Text, { id : Text; name : Text; color : Text; createdAt : Text; category : Category }>>(
      func(_principal, habitsMap) {
        habitsMap.map<Text, OldHabit, { id : Text; name : Text; color : Text; createdAt : Text; category : Category }>(
          func(_id, oldHabit) {
            {
              oldHabit with category = #miscellaneous;
            };
          }
        );
      }
    );
    {
      old with
      userHabits = newUserHabits
    };
  };
};
