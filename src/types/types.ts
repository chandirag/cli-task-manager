/**
 * Enum representing task priorities.
 */
export enum Priority {
	LOW = "Low",
	MEDIUM = "Medium",
	HIGH = "High",
}

/**
 * Interface representing a task.
 */
export interface ITask {
	id: string;
	name: string;
	priority: Priority;
	category: string;
	dueDate: Date;
	isCompleted: boolean;
}

/**
 * Interface for prompt options used in menus
 */
export interface IPromptOption {
	name: string;
	value: string | number;
	short?: string;
}

/**
 * Type for menu action handlers
 */
export type MenuActionHandler = () => Promise<void>;

/**
 * Interface for menu items
 */
export interface IMenuItem {
	name: string;
	value: string;
	handler: MenuActionHandler;
}
