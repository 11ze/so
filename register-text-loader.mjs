/**
 * 测试入口：注册文本 loader（node 官方推荐方式，替代已弃用的 --experimental-loader）。
 * 用法见 package.json 的 test:result 脚本（--import 本文件）。
 */
import { register } from 'node:module';

register('./text-loader.mjs', import.meta.url);
