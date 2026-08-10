import { registerPlugin } from '@capacitor/core';

export interface FileSaverPlugin {
  saveAs(options: { data: string; filename: string }): Promise<{ success: boolean }>;
}

const FileSaver = registerPlugin<FileSaverPlugin>('FileSaver');

export default FileSaver;
