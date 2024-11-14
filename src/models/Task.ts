import { ITask, Priority } from "../types/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Class representing a task.
 */
export class Task implements ITask {
	id: string;
	name: string;
	priority: Priority;
	category: string;
	dueDate: Date;
	isCompleted: boolean;

	/**
	 * Creates an instance of Task.
	 * @param name - The name of the task.
	 * @param priority - The priority of the task.
	 * @param category - The category of the task.
	 * @param dueDate - The due date of the task.
	 */
	constructor(name: string, priority: Priority, category: string, dueDate: Date) {
		this.id = uuidv4();
		this.name = name;
		this.priority = priority;
		this.category = category;
		this.dueDate = dueDate;
		this.isCompleted = false;
	}
}
