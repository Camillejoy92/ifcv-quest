import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const root='dist';
const files=[
  ['index.html', 500000],
  ['vendor/pdf.min.mjs',120000],
  ['vendor/pdf.worker.min.mjs',300000],
  ['vendor/pdf-lib.min.js',150000],
];
for(const [name,min] of files){
 const size=(await stat(join(root,name))).size;
 if(size<min)throw Error(name+' fichier manquant ou incomplet: '+size);
 console.log('VALIDÉ '+name+' ('+size+' octets)');
}
const html=await readFile(join(root,'index.html'),'utf8');
for(const id of ['v8NavButton','v8ProspectPDF','v8RecruiterPDF','V76_TRACKS']){
 if(!html.includes(id))throw Error('Module IFCV QUEST absent: '+id);
}
for(const p of ['./vendor/pdf.min.mjs','./vendor/pdf.worker.min.mjs','./vendor/pdf-lib.min.js']){
 if(!html.includes(p))throw Error('Référence PDF absente: '+p);
}
console.log('IFCV QUEST V8 - présence des modules et des bibliothèques validée');
