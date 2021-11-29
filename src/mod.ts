import fs from 'fs-extra';
import rd from 'rd';
import path from 'path';

// 获得当前执行node命令时候的文件夹目录名
const commandPath = process.cwd();

export interface FileInfoType {
  path: string;
  name: string;
  root: string;
  base: string;
  dir: string;
  ext: string;
}

export interface FileType {
  files: string[];
  filesInfo: FileInfoType[];
}

export default function loadFile(filePath: string) {
  return async (): Promise<FileType | null> => {
    const metaFilePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(commandPath, filePath);
    // NOTE: 判断 metaFilePath 是否存在
    if (!fs.existsSync(metaFilePath)) {
      return null;
    }

    // 同步
    const files = rd.readFileSync(metaFilePath);
    const result = files.map((filePath) => {
      return {
        path: filePath,
        ...path.parse(filePath),
      };
    });

    // console.log('debug', metaFilePath, result);
    return { files, filesInfo: result };
  };
}

// loadFile('./example')();
