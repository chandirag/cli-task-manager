/**
 * Clears the console screen.
 */
export const clearScreen = (): void => {
	process.stdout.write("\x1Bc");
};
