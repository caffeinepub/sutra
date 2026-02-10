# Specification

## Summary
**Goal:** Add habit categories across the backend and UI so users can create, edit, and organize habits by category.

**Planned changes:**
- Extend the backend Habit data model to include a text `category` field and update habit CRUD methods to persist/return it with existing access-control behavior unchanged.
- Ensure upgrades preserve existing stored habits by assigning a safe default category to any habit missing one.
- Update the Create Habit and Edit Habit modals to include a “Category” input (with sensible defaults) and submit the selected category on save.
- Display each habit’s category on Habit cards and add a way to organize habits by category (either grouping or a category filter control).
- Update frontend types and React Query hooks/mutations to match the updated habit/category API.

**User-visible outcome:** Users can choose a category when creating habits, change categories when editing, and see/organize habits by category in the main habits view; existing habits remain available after upgrade with a default category applied.
