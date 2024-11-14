import { Task } from "../models/Task";
import { Priority } from "../types/types";

export class TaskService {
	private tasks: Task[] = [];

	addTask(name: string, priority: Priority, category: string, dueDate: Date): Task {
		const task = new Task(name, priority, category, dueDate);
		this.tasks.push(task);
		return task;
	}

	getAllTasks(): Task[] {
		return this.tasks;
	}

	markTaskAsComplete(taskId: string): boolean {
		const task = this.tasks.find((t) => t.id === taskId);
		if (task) {
			task.isCompleted = true;
			return true;
		}
		return false;
	}

	removeTask(taskId: string): boolean {
		const initialLength = this.tasks.length;
		this.tasks = this.tasks.filter((t) => t.id !== taskId);
		return this.tasks.length !== initialLength;
	}

	getTasksByPriority(priority: Priority): Task[] {
		return this.tasks.filter((task) => task.priority === priority);
	}

	getTasksByCategory(category: string): Task[] {
		return this.tasks.filter((task) => task.category.toLowerCase() === category.toLowerCase());
	}

	getTasksSortedByDueDate(ascending: boolean = true): Task[] {
		return [...this.tasks].sort((a, b) => {
			const comparison = a.dueDate.getTime() - b.dueDate.getTime();
			return ascending ? comparison : -comparison;
		});
	}

	getUniqueCategories(): string[] {
		return [...new Set(this.tasks.map((task) => task.category))];
	}
}
