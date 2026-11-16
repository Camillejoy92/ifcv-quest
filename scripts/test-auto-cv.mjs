import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import * as PDFLib from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const code=await readFile('SOURCE_V8/auto-cv.js','utf8');
const auto=Function('window','document',code+';return window.IFCVAutoCV;')({}, {getElementById:()=>null});
const {PDFDocument,StandardFonts,rgb}=PDFLib;
let checks=0;
function ok(condition,message){assert.ok(condition,message);checks++;}
function linesFor(doc,variant){
 const base=variant==='complete'?[
 'ALEX MARTIN  Paris alex@example.org 06 12 34 56 78',
 'Candidature : BTS MCO en alternance IFCV',
 'EXPERIENCES PROFESSIONNELLES',
 '2025 - Vendeur polyvalent, contrat CDD',
 'Accueil et conseil client, gestion du stock et encaissements',
 '2024 - Benevolat associatif',
 'Organisation des collectes pour une association',
 'FORMATION',
 '2025 - Baccalaureat professionnel',
 'COMPETENCES',
 'Relation client, organisation, bureautique et rigueur',
 'LANGUES - anglais niveau B1']:[
 'ALEX MARTIN - Paris',
 'PROFIL recherche une alternance BTS MCO',
 'EXPERIANCES PROFESSIONNELLES',
 'Vendeur polyvalent dans une boutique',
 'Encaissements, mise en rayon, stock et livraison',
 'FORMATION',
 'Baccalaureat professionnel',
 'COMPETANCES',
 'Sens du service, organisation, equipe',
 'LANGUES Anglais B1',
 'CENTRES D INTERET benevolat et sport'];
 return base;
}
async function create(variant,multi=false){
 const d=await PDFDocument.create(),font=await d.embedFont(StandardFonts.Helvetica);
 const pg=d.addPage([595,842]);
 linesFor(d,variant).forEach((t,i)=>pg.drawText(t,{x:50,y:790-i*44,font,size:11,color:rgb(.1,.2,.3)}));
 if(multi){const p2=d.addPage([595,842]);p2.drawText('AUTRES EXPERIENCES PROFESSIONNELLES', {x:45,y:760,font,size:12});p2.drawText('2023 : Stage en entreprise, conseil aux clients et accueil', {x:45,y:725,font,size:11});}
 return new Uint8Array(await d.save({useObjectStreams:false}));
}
async function parse(bytes){
 const pdf=await pdfjs.getDocument({data:new Uint8Array(bytes),useSystemFonts:true}).promise;
 const pages=[];
 for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i),v=p.getViewport({scale:1}),t=await p.getTextContent();pages.push({width:v.width,height:v.height,lines:auto.pdfLines(t.items,v.width,v.height,i)});}
 return pages;
}
await mkdir('tests-output',{recursive:true});
for(const [id,opts] of [['ameliorer',{}],['structure',{variant:'complete'}],['multpages',{multi:true}]]){
 const bytes=await create(opts.variant||'errors',!!opts.multi);
 const pages=await parse(bytes),review=auto.analyze(pages,'BTS MCO');
 ok(review.readable,id+': extraction non lisible');
 ok(review.notes.length>0,id+': aucun retour de relecture');
 if(id==='ameliorer'){ok(review.notes.some(n=>n.key==='email'),'e-mail absent non reconnu');ok(review.notes.some(n=>n.key==='phone'),'téléphone absent non reconnu');}
 if(id==='structure'){ok(!review.notes.some(n=>n.key==='email'),'faux défaut e-mail');ok(!review.notes.some(n=>n.key==='phone'),'faux défaut téléphone');}
 const pdf=await auto.annotatePdf({arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)},pages,review.notes,PDFLib);
 const data=new Uint8Array(await pdf.arrayBuffer()),outDoc=await PDFDocument.load(data);
 ok(outDoc.getPageCount()===pages.length,id+': nombre pages modifié');
 ok(outDoc.getPages()[0].getWidth()>795,id+': marge rouge manquante');
 const rendered=await parse(data),txt=rendered.flatMap(p=>p.lines.map(l=>l.text)).join(' ');
 ok(txt.includes('DIAGNOSTIC CV'),id+': titre annotation absent');
 ok(txt.includes('ALEX MARTIN'),id+': texte original absent');
 ok(txt.includes('Conseils automatiques'),id+': note de prudence absente');
 await writeFile('tests-output/CV_IFCV_'+id+'_annote.pdf',data);
 console.log(id,'annotations',review.notes.map(n=>n.key).join(','),'bytes',data.length);
}
const scanned=auto.analyze([{width:595,height:842,lines:[]}],'BTS MCO');
ok(!scanned.readable&&scanned.notes.length===0,'scan sans texte doit être refusé');
console.log('TESTS AUTOMATIQUES PDF.JS + PDF-LIB : '+checks+' contrôles réussis.');
