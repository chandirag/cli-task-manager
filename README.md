# Command Line Task Manager

A TypeScript-based command-line application for managing daily tasks efficiently.

> [!NOTE]  
> Similar to other cli tools like create-react-app the application uses [Inquirer](https://www.npmjs.com/package/@inquirer/prompts) to provide an interactive way to use the app.



<div align="center">
  <video width="100%" src="https://github.com/user-attachments/assets/f525a860-80c1-4e41-a01c-98150a6713f0" controls>
  </video>
  <p><i>Demo of Command Line Task Manager in action.</i></p>
</div>

## Core Requirements


-   Add tasks with essential information (name, priority, category, due date)
-   View all tasks in a formatted table
-   Mark tasks as complete
-   Remove tasks

<br>

## Extended Capabilities

Beyond the core requirements, the application offers:

#### 1. Dynamic Terminal UI

-   Clean table-based display of tasks
-   Interactive menus with keyboard navigation
-   Search-as-you-type (auto complete / combobox) category selection
-   Clear success/error feedback

#### 2. Task Management

-   Edit existing tasks (name, priority, category, due date, completion status)
-   Category management with search and auto-complete
-   Validation for inputs
    -   Null values
    -   Date formats
    -   Past due dates

#### 3. View & Filter Options

-   Filter tasks by priority (Low, Medium, High)
-   Filter tasks by category
-   Filter tasks by completion status
-   Filter tasks by due date (Today, This Week, This Month)
-   Sort tasks by due date
-   Real-time fuzzy search across task name, category, and completion status

#### 4. Data Persistence

-   SQLite database for persistent storage

<br>

## Getting Started

1. Install a recent version of NodeJS using a preffered method or using nvm.

2. Clone repository

3. Install dependencies
   ```
   npm install
   ```

4. Run app
   ```
    npm run start
    ```

