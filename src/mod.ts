import fs from 'fs-extra';
import rd from 'rd';
import path from 'path';
import md5 from 'crypto-js/md5.js';
import { commandPath } from './config.js';
import localdb from './local.js';

const fileTables = localdb.tables;

export interface FileInfoType {
  path: string;
  name: string;
  root: string;
  base: string;
  dir: string;
  ext: string;
  changed: boolean;
}

export interface FileType {
  files: string[];
  filesInfo: FileInfoType[];
  deleted: string[];
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
    // NOTE: 没有文件返回 null
    if (files.length === 0) {
      return null;
    }

    // NOTE: 判断下删除的文件
    const filesCache = fileTables.getAll();

    const deleted = filesCache
      .filter((it) => !files.includes(it.filepath))
      .map((it) => it.filepath);

    if (deleted.length > 0) {
      fileTables.deleteMany({
        where: (it) => deleted.includes(it.filepath),
      });
    }

    const result = files.map((filePath) => {
      const newMd5 = md5(fs.readFileSync(filePath, 'utf-8')).toString();
      const files = fileTables.findMany({
        where: (it) => it.filepath === filePath,
      });
      let isChanged = false;
      if (files.length === 1) {
        const file = files[0];
        isChanged = file.md5 !== newMd5;
        if (isChanged) {
          fileTables.updateById(file.id, { md5: newMd5 });
        }
      } else {
        fileTables.create({ filepath: filePath, md5: newMd5 });
        isChanged = true;
      }

      return {
        path: filePath,
        ...path.parse(filePath),
        changed: isChanged,
      };
    });
    await localdb.write();

    // console.log('debug', metaFilePath, result);
    return { files, filesInfo: result, deleted };
  };
}
