import { TaskService } from "./services/TaskService";
import { ConsoleUI } from "./ui/ConsoleUI";

const taskService = new TaskService();
const ui = new ConsoleUI(taskService);

ui.showMainMenu();
