import inquirer from "inquirer";
import { BaseUI } from "../base/BaseUI";
import { TaskService } from "../../services/TaskService";
import { IMenuItem } from "../../types/types";
import { TableComponent } from "../components/TableComponent";
import { SearchHandler } from "./SearchHandler";
import { TaskHandler } from "./TaskHandler";
import { FilterHandler } from "./FilterHandler";
import { clearScreen } from "../../utils/console";

/**
 * Handles all menu-related operations in the application.
 * This includes displaying menus, handling menu selections, and routing to appropriate handlers.
 */
export class MenuHandler extends BaseUI {
	private readonly mainMenuItems: IMenuItem[];
	private readonly viewMenuItems: IMenuItem[];
	private readonly tableComponent: TableComponent;
	private readonly searchHandler: SearchHandler;
	private readonly taskHandler: TaskHandler;
	private readonly filterHandler: FilterHandler;

	/**
	 * Creates an instance of MenuHandler.
	 * Initializes menu items and required handlers.
	 * @param taskService - The service for managing tasks
	 */
	constructor(taskService: TaskService) {
		super(taskService);
		this.tableComponent = new TableComponent();
		this.searchHandler = new SearchHandler(taskService);
		this.taskHandler = new TaskHandler(taskService);
		this.filterHandler = new FilterHandler(taskService);

		this.mainMenuItems = [
			{ name: "📝 Add Task", value: "add", handler: this.taskHandler.handleAddTask.bind(this.taskHandler) },
			{ name: "👀 View All Tasks", value: "viewAll", handler: this.handleViewAllTasks.bind(this) },
			{
				name: "🔍 Search Tasks",
				value: "search",
				handler: this.searchHandler.handleSearch.bind(this.searchHandler),
			},
			{ name: "🔍 Filter/Sort Tasks", value: "filter", handler: this.showViewOptions.bind(this) },
			{ name: "✍🏼 Edit Task", value: "edit", handler: this.taskHandler.handleEditTask.bind(this.taskHandler) },
			{ name: "✅ Mark Task as Complete", value: "complete", handler: this.handleMarkTaskComplete.bind(this) },
			{
				name: "🗑️ Remove Task",
				value: "remove",
				handler: this.taskHandler.handleRemoveTask.bind(this.taskHandler),
			},
			{ name: "👋 Exit", value: "exit", handler: this.handleExit.bind(this) },
		];

		this.viewMenuItems = [
			{ name: "📋 View All Tasks", value: "all", handler: this.handleViewAllTasks.bind(this) },
			{
				name: "⭐ Filter by Priority",
				value: "priority",
				handler: this.filterHandler.handleFilterByPriority.bind(this.filterHandler),
			},
			{
				name: "🏷️  Filter by Category",
				value: "category",
				handler: this.filterHandler.handleFilterByCategory.bind(this.filterHandler),
			},
			{
				name: "📅 Sort by Due Date",
				value: "date",
				handler: this.filterHandler.handleSortByDueDate.bind(this.filterHandler),
			},
			{ name: "⏪  Back to Main Menu", value: "back", handler: this.showMainMenu.bind(this) },
		];
	}

	/**
	 * Displays a menu with the given title and items.
	 * Handles user selection and routes to appropriate handlers.
	 * @param title - The title of the menu to display
	 * @param menuItems - Array of menu items to display
	 * @param isSubMenu - Whether this is a submenu (affects return behavior)
	 */
	private async displayMenu(title: string, menuItems: IMenuItem[], isSubMenu: boolean = false): Promise<void> {
		try {
			const { action } = await inquirer.prompt([
				{
					type: "list",
					name: "action",
					message: title,
					choices: menuItems.map((item) => ({
						name: item.name,
						value: item.value,
					})),
					loop: false,
					pageSize: 10,
				},
			]);

			const menuItem = menuItems.find((item) => item.value === action);
			if (menuItem) {
				await menuItem.handler();

				// Handle menu return logic
				if (menuItem.value === "back") {
					// If "back" was selected, return to main menu
					await this.showMainMenu();
				} else if (!isSubMenu && menuItem.value !== "exit") {
					// If in main menu and not exiting, return to main menu
					await this.showMainMenu();
				} else if (isSubMenu && menuItem.value !== "back") {
					// If in submenu and not going back, stay in submenu
					await this.showViewOptions();
				}
			}
		} catch (error) {
			if (this.isUserInterruptionError(error)) {
				console.log("\n👋 Goodbye!");

				process.exit(0);
			}
			console.error("Menu error:", error);
			if (!isSubMenu) {
				await this.showMainMenu();
			} else {
				await this.showViewOptions();
			}
		}
	}

	/**
	 * Displays the main menu of the application.
	 * This is the primary entry point for user interaction.
	 */
	public async showMainMenu(): Promise<void> {
		await this.displayMenu("Task Manager", this.mainMenuItems, false);
	}

	/**
	 * Displays the view/filter options menu.
	 * Allows users to choose different ways to view and filter tasks.
	 */
	private async showViewOptions(): Promise<void> {
		await this.displayMenu("Filter/Sort Options", this.viewMenuItems, true);
	}

	/**
	 * Handles the display of all tasks.
	 * Shows a table of all tasks if any exist.
	 */
	private async handleViewAllTasks(): Promise<void> {
		try {
			const tasks = await this.taskService.getAllTasks();
			if (tasks.length === 0) {
				console.log("\nNo tasks found!");
				return;
			}

			clearScreen();
			this.tableComponent.formatTasksToTable(tasks);
		} catch (error) {
			console.error("Error viewing tasks:", error);
		}
	}

	/**
	 * Handles marking a task as complete.
	 * Shows a list of incomplete tasks and allows user to select one to mark as complete.
	 */
	private async handleMarkTaskComplete(): Promise<void> {
		try {
			const tasks = await this.taskService.getAllTasks();
			if (tasks.length === 0) {
				console.log("\nNo tasks available!");
				return;
			}

			const incompleteTasks = tasks.filter((task) => !task.isCompleted);
			if (incompleteTasks.length === 0) {
				console.log("\nNo incomplete tasks available!");
				return;
			}

			const { taskId } = await inquirer.prompt([
				{
					type: "list",
					name: "taskId",
					message: "Select task to mark as complete:",
					choices: incompleteTasks.map((task) => ({
						name: `${task.name} (${task.priority}, Due: ${task.dueDate.toLocaleDateString()})`,
						value: task.id,
					})),
				},
			]);

			await this.taskService.markTaskAsComplete(taskId);
			console.log("Task marked as complete!");
		} catch (error) {
			if (this.isUserInterruptionError(error)) {
				return;
			}
			console.error("Error marking task as complete:", error);
		}
	}

	/**
	 * Handles the exit process of the application.
	 * Prompts for confirmation before exiting.
	 */
	private async handleExit(): Promise<void> {
		const { confirm } = await inquirer.prompt([
			{
				type: "confirm",
				name: "confirm",
				message: "Are you sure you want to exit?",
				default: false,
			},
		]);

		if (confirm) {
			console.log("👋 Goodbye! Your tasks will be here when you come back!");
			process.exit(0);
		}
	}
}
