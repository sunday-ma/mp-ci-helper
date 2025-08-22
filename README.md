# mp-ci-helper

微信小程序 CI 工具。

## 安装

`pnpm add mp-ci-helper -D`

## 配置

项目根目录创建配置文件：`mp-ci-helper.config.ts`

```ts
import { MpCiConfig } from 'mp-ci-helper';

// 详细配置项含义参考 https://www.npmjs.com/package/miniprogram-ci
const config: MpCiConfig = {
  project: {
    appid: '',
    type: 'miniProgram', // 项目类型
    projectPath: 'dist/build/mp-weixin', // 生产环境代码路径
    privateKeyPath: 'private.key', // 代码上传密钥文件路径
    ignores: ['node_modules/**/*'],
  },
  upload: {
    setting: {
      es6: true,
      es7: true,
      minify: true,
      minifyJS: true,
      minifyWXML: true,
      minifyWXSS: true,
      autoPrefixWXSS: true,
    },
    onProgressUpdate: console.log,
  },
};

export default config;
```

## 用法

构建之后执行 `mp-ci-helper` 脚本。

```json
"scripts": {
    "build:mp-weixin": "uni build -p mp-weixin && mp-ci-helper",
}
```
