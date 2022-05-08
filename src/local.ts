import path from 'path';
import Localdb, { createSchema } from '@redchili/localdb';
import { commandPath } from './config';

import { Schema } from 'jtd';

const md5Model = {
  properties: {
    filepath: { type: 'string' },
    md5: { type: 'string' },
  },
} as Schema;

// 指定 file md5 cache 目录
const md5FilePath = path.resolve(
  commandPath,
  './node_modules/.codegem-load-file/md5.json',
);

const localdb = new Localdb<{ filepath: string; md5: string }>(md5FilePath, {
  schema: createSchema([md5Model]),
});

export default localdb;
