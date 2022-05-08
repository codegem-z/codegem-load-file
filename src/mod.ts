import fs from 'fs-extra';
import rd from 'rd';
import path from 'path';
import md5 from 'crypto-js/md5.js';
import { commandPath } from './config.js';
import fileMd5Db from './local.js';

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
    const filesCache = fileMd5Db.tables.getAll();

    const deleted = filesCache
      .filter((it) => !files.includes(it.filepath))
      .map((it) => it.filepath);

    if (deleted.length > 0) {
      fileMd5Db.tables.deleteMany({
        where: (it) => deleted.includes(it.filepath),
      });
    }

    const result = files.map((filePath) => {
      const fileNewMd5 = md5(fs.readFileSync(filePath, 'utf-8')).toString();
      const fileCache = fileMd5Db.tables.findOne({
        where: (it) => it.filepath === filePath,
      });
      const isChanged = fileCache ? fileCache.md5 !== fileNewMd5 : true;
      if (!fileCache) {
        fileMd5Db.tables.create({ filepath: filePath, md5: fileNewMd5 });
      }
      if (isChanged) {
        fileMd5Db.tables.update({
          where: (it) => it.filepath === filePath,
          data: { md5: fileNewMd5 },
        });
      }
      return {
        path: filePath,
        ...path.parse(filePath),
        changed: isChanged,
      };
    });
    await fileMd5Db.write();

    // console.log('debug', metaFilePath, result);
    return { files, filesInfo: result, deleted };
  };
}
