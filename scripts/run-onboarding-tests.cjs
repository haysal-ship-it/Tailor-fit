// Run the TypeScript tour tests directly without spawning a restricted child process.
const fs=require('node:fs');
const ts=require('typescript');
const previous=require.extensions['.ts'];
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
try{require('../lib/onboarding/onboarding.test.ts');}finally{if(previous)require.extensions['.ts']=previous;else delete require.extensions['.ts'];}
