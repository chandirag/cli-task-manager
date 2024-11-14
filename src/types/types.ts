export enum Priority {
	LOW = "Low",
	MEDIUM = "Medium",
	HIGH = "High",
}

export interface ITask {
	id: string;
	name: string;
	priority: Priority;
	category: string;
	dueDate: Date;
	isCompleted: boolean;
}
