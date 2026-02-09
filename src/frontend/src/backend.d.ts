import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type HabitId = string;
export interface Habit {
    id: HabitId;
    name: string;
    createdAt: Date_;
    color: string;
}
export type Date_ = string;
export interface Completion {
    date: Date_;
    completed: boolean;
    habitId: HabitId;
}
export interface UserProfile {
    displayName: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createHabit(name: string, color: string): Promise<HabitId>;
    deleteHabit(habitId: HabitId): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDisplayName(): Promise<string | null>;
    getHabitCompletions(habitId: HabitId): Promise<Array<Completion>>;
    getHabits(): Promise<Array<Habit>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markCompletion(habitId: HabitId, date: Date_, completed: boolean): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setDisplayName(displayName: string): Promise<void>;
    updateHabit(id: HabitId, name: string, color: string): Promise<boolean>;
}
