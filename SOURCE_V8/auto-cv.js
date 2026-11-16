/* IFCV QUEST V8.0.2 — Analyse et annotations PDF automatiques.
   Moteur de règles explicites : ne constitue ni OCR ni correction grammaticale exhaustive.
   Exécution exclusivement dans le navigateur ; aucune donnée CV envoyée à un serveur. */
(() => {
  'use strict';
  const $a = id => document.getElementById(id);
  const clean = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\u2019\u2018]/g, "'");
  const simplify = s => String(s || '').replace(/[\u2010-\u2015]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[^\x20-\x7E\u00C0-\u00FF\n]/g, ' ').replace(/\s+/g, ' ').trim();
  function pdfLines(items, width, height, pageNum) {
    const words = items.filter(i => typeof i.str === 'string' && i.str.trim() && Array.isArray(i.transform) && i.transform.length >= 6)
      .map(i => {
        const w = Math.min(width, Math.abs(i.width || i.str.length*5));
        const h = Math.max(5, Math.min(28, Math.abs(i.height || i.transform[3] || 10)));
        const x = Math.max(0, Math.min(width, i.transform[4]));
        const top = Math.max(0, Math.min(height-h, height-i.transform[5]-h));
        return {txt:i.str.trim(),x,top,w,h,page:pageNum};
      }).sort((a,b)=>a.top-b.top||a.x-b.x);
    const lines=[];
    for(const word of words){
      const last=lines[lines.length-1];
      if(last && Math.abs(last.top-word.top)<Math.max(3,Math.min(5,word.h*.45))){
        last.parts.push(word);last.x=Math.min(last.x,word.x);
      } else lines.push({top:word.top,x:word.x,parts:[word],page:pageNum});
    }
    return lines.map(line=>({text:line.parts.sort((a,b)=>a.x-b.x).map(x=>x.txt).join(' '),x:line.x,top:line.top,page:pageNum,w:width,h:height}));
  }
  function analyze(pages, programme='') {
    const all=pages.flatMap(p=>p.lines||[]);
    const raw=all.map(x=>x.text).join('\n');
    const n=clean(raw), words=raw.split(/\s+/).filter(Boolean);
    const letters=(raw.match(/\p{L}/gu)||[]).length;
    if(!raw.trim() || words.length<12 || letters<65 || letters/Math.max(1,raw.replace(/\s/g,'').length)<.50)
      return {readable:false,reason:'Le texte du CV n’est pas suffisamment lisible. Aucun diagnostic ni annotation automatique n’est créé. Pour un CV scanné, utilise une version texte ou un OCR.',notes:[],wordCount:words.length};
    const get=(rx)=>all.find(l=>rx.test(clean(l.text)));
    const near=(rx,fall=0.16)=>{
      const l=get(rx);
      return l?{page:l.page,u:Math.min(.93,Math.max(.04,l.x/l.w)),v:Math.min(.94,Math.max(.04,(l.top+7)/l.h))}:{page:1,u:.12,v:fall};
    };
    const notes=[];
    function add(key,title,text,anchor,severity='Conseil',basis=''){
      if(notes.some(n=>n.key===key))return;
      notes.push({key,title,text,severity,basis,page:anchor.page,u:anchor.u,v:anchor.v});
    }
    if(!/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(raw)) add('email','Coordonnées : e-mail','Ajoute une adresse e-mail de contact lisible et professionnelle.',near(/profil|contact|coordonne|prenom|nom/, .12),'À corriger','Aucune adresse e-mail reconnue dans le texte du PDF.');
    if(!/(?:\+33|0)[\s.\-]?[1-9](?:[\s.\-]?\d{2}){4}/.test(raw)) add('phone','Coordonnées : téléphone','Ajoute un numéro de téléphone où l’entreprise peut te joindre.',near(/contact|coordonne|prenom|nom/, .16),'À corriger','Aucun numéro français identifié dans le texte.');
    const exp=/(experience|experiance|experience professionnelle|parcours professionnel|emplois|stages|activites professionnelles)/;
    const edu=/(formation|diplome|parcours scolaire|etudes|education|certification)/;
    const skills=/(competence|competance|savoir.faire|aptitudes|outils maitrises)/;
    if(!exp.test(n)) add('experience','Rubrique expériences','Ajoute une rubrique « Expériences » : stages, emplois, projets ou bénévolat, avec les missions réellement réalisées.',near(/profil|objectif/, .44),'À vérifier','Rubrique expériences non reconnue dans le texte.');
    if(!edu.test(n)) add('formation','Rubrique formation','Ajoute tes formations et diplômes, avec les établissements et les années, du plus récent au plus ancien.',near(/experience|competence/, .77),'À corriger','Rubrique formation non identifiée.');
    if(!skills.test(n)) add('skills','Compétences identifiables','Présente des compétences concrètes que tu peux illustrer en entretien, sans inventer de savoir-faire.',near(/profil|formation/, .65),'Conseil','Rubrique compétences non reconnue.');
    const exHead=all.findIndex(l=>exp.test(clean(l.text)) && clean(l.text).length<90);
    if(exHead>=0){
      let content=[];
      for(let i=exHead+1;i<Math.min(exHead+22,all.length);i++){
        const s=clean(all[i].text);
        if(i>exHead+1&&/^(formation|competence|langues|centres d'interet|profil|contact)/.test(s))break;
        content.push(all[i]);
      }
      if(content.length>=2){
        const text=content.map(l=>l.text).join(' ');
        if(!/(19|20)\d\d|\b(0?[1-9]|1[0-2])\/\d{4}\b/.test(text))add('dates','Dates des expériences','Précise les périodes de tes expériences (mois et année si possible) et le type de contrat.',{page:content[0].page,u:Math.min(.91,content[0].x/content[0].w),v:Math.min(.95,content[0].top/content[0].h)},'À vérifier','Aucune période reconnue dans la zone Expériences.');
        const substantive=content.filter(l=>clean(l.text).length>20&&!/^(stage|cdd|cdi|alternance|\d{4})/.test(clean(l.text)));
        if(substantive.length && !/\b(resultat|realise|contribue|amelior|augment|reduit|organis|accueill|conseill|assure|gere|particip)/.test(clean(text))){
          const l=substantive[0];add('missions','Décrire les réalisations','Tu listes des tâches : précise ton rôle personnel et un exemple concret ou résultat vérifiable.',{page:l.page,u:Math.min(.92,l.x/l.w),v:Math.min(.95,(l.top+7)/l.h)},'Conseil','Peu de verbes d’action identifiés dans la zone Expériences.');
        }
      }
    }
    const prog=clean(programme).replace(/\s*[·\-].*$/,'').replace(/\s+niveau\s+\d+.*$/,'').trim();
    if(prog.length>=5 && !n.includes(prog) && !(prog.startsWith('bac pro')&&n.includes('bac pro'))){
      add('cible','Formation visée','Indique l’intitulé exact de la formation IFCV recherchée et ton rythme d’alternance, après vérification auprès de l’école.',near(/profil|objectif|recherche|candidat/, .20),'Conseil','Formation sélectionnée dans le jeu non retrouvée telle quelle dans le CV.');
    }
    const typos=[[/\bexperiance(s)?\b/,'« expérience »'],[/\bcompetance(s)?\b/,'« compétence »'],[/\baccueuil\b/,'« accueil »'],[/\bresponssable\b/,'« responsable »'],[/\bprofessionelle(s)?\b/,'« professionnelle »']];
    for(const [rx,correct] of typos){
      const l=get(rx);
      if(l){add('typo'+notes.length,'Orthographe à relire',`Vérifie l’orthographe de ce terme. Proposition : ${correct}.`,{page:l.page,u:Math.min(.92,l.x/l.w),v:Math.min(.96,(l.top+7)/l.h)},'À corriger',`Terme détecté : ${l.text.slice(0,85)}`)}
    }
    if(words.length>800)add('length','Lisibilité et longueur','Le CV contient beaucoup de texte : hiérarchise les expériences utiles et raccourcis les formulations répétitives, sans supprimer de faits importants.',near(/experience|formation/, .36),'Conseil',`${words.length} mots détectés dans le document.`);
    if(!notes.length)add('review','Contrôle final','Les principaux repères sont présents. Vérifie maintenant la pertinence des missions, les dates et l’absence de fautes ; cette analyse automatique ne remplace pas une relecture.',{page:1,u:.12,v:.15},'Contrôle humain nécessaire','Aucune règle d’alerte déclenchée.');
    // Ne jamais dépasser 7 annotations par page : au-delà, risquerait de masquer la lisibilité.
    const counts=new Map();const filtered=[];
    for(const note of notes){const k=note.page,c=counts.get(k)||0;if(c>=7)continue;counts.set(k,c+1);filtered.push(note);}
    filtered.forEach((note,i)=>{
      note.number=i+1;
      // Évite que deux badges rouges se recouvrent pour deux conseils au même endroit.
      const previous=filtered.slice(0,i).filter(x=>x.page===note.page);
      let shift=0;
      while(previous.some(x=>Math.abs(x.u-note.u)<.025 && Math.abs(x.v-(note.v+shift))<.035) && shift<.15)shift+=.04;
      note.v=Math.min(.96,note.v+shift);
    });
    return {readable:true,notes:filtered,wordCount:words.length,raw};
  }
  function wrap(text,font,size,maxW,maxLines=4){
    const words=simplify(text).split(/\s+/).filter(Boolean),result=[];let line='';
    for(let part of words){
      if(font.widthOfTextAtSize(part,size)>maxW){
        while(part.length>1&&font.widthOfTextAtSize(part,size)>maxW){const end=Math.max(1,Math.floor(part.length*.73));const start=part.slice(0,end);if(line){result.push(line);line=''}result.push(start);part=part.slice(end)}
      }
      const cand=line?line+' '+part:part;
      if(font.widthOfTextAtSize(cand,size)>maxW&&line){result.push(line);line=part}else line=cand;
    }
    if(line)result.push(line);
    if(result.length>maxLines){const r=result.slice(0,maxLines);r[maxLines-1]=r[maxLines-1].slice(0,-3)+'...';return r;}
    return result;
  }
  async function annotatePdf(fileOrBytes,pages,notes,lib) {
    if(!lib?.PDFDocument)throw Error('pdf-lib doit être installé pour exporter les annotations.');
    const sourceBytes=fileOrBytes instanceof Uint8Array?fileOrBytes:new Uint8Array(await fileOrBytes.arrayBuffer());
    const src=await lib.PDFDocument.load(sourceBytes),srcPages=src.getPages();
    if(srcPages.length!==pages.length)throw Error('Pages PDF incohérentes : export arrêté.');
    for(const p of srcPages)if(p.getRotation().angle%360!==0)throw Error('Ce document contient une page tournée : export automatique non autorisé.');
    const output=await lib.PDFDocument.create();
    const embedded=await output.embedPdf(sourceBytes,srcPages.map((_,index)=>index));const regular=await output.embedFont(lib.StandardFonts.Helvetica),bold=await output.embedFont(lib.StandardFonts.HelveticaBold);
    const red=lib.rgb(.70,.10,.18),pale=lib.rgb(1,.955,.965),paper=lib.rgb(.987,.984,.988),muted=lib.rgb(.34,.37,.42);
    for(let i=0;i<srcPages.length;i++){
      const pg=srcPages[i],W=pg.getWidth(),H=pg.getHeight(),extra=220;
      if(W<230||H<300)throw Error('Format PDF trop petit pour des annotations lisibles.');
      const out=output.addPage([W+extra,H]);
      out.drawPage(embedded[i],{x:0,y:0,width:W,height:H});
      out.drawRectangle({x:W,y:0,width:extra,height:H,color:paper});
      out.drawRectangle({x:W,y:0,width:2.5,height:H,color:red});
      out.drawText('DIAGNOSTIC CV', {x:W+13,y:H-32,size:13,font:bold,color:red});
      out.drawText('IFCV QUEST  |  page '+(i+1),{x:W+13,y:H-48,size:9,font:regular,color:muted});
      const current=notes.filter(n=>n.page===i+1).slice(0,7);const startY=H-67,footerH=35;const height=Math.min(100,Math.max(56,(startY-footerH)/Math.max(1,current.length)));
      for(let j=0;j<current.length;j++){
        const note=current[j],top=startY-j*height,x=W+11,boxW=extra-22,boxH=height-6;
        out.drawRectangle({x,y:top-boxH,width:boxW,height:boxH,color:pale,borderColor:red,borderWidth:.65});
        const tag=String(note.number||j+1);
        out.drawCircle({x:x+15,y:top-16,size:10,color:red});
        out.drawText(tag,{x:x+(tag.length>1?8.5:12),y:top-19.5,size:9,font:bold,color:lib.rgb(1,1,1)});
        const heading=wrap(note.title,bold,9,boxW-45,1)[0]||'Conseil';
        out.drawText(heading,{x:x+30,y:top-19,size:9,font:bold,color:red});
        const lines=wrap(note.text,regular,8.4,boxW-17,Math.max(2,Math.floor((boxH-26)/11)));
        lines.forEach((l,k)=>out.drawText(l,{x:x+9,y:top-33-k*10.5,size:8.4,font:regular,color:red}));
        // Repère rouge positionné sur la page d'origine (sans effacer ni réécrire le CV).
        const fromX=Math.min(W-10,Math.max(14,note.u*W)),fromY=Math.min(H-12,Math.max(14,(1-note.v)*H));
        const toY=top-Math.min(21,boxH/2);
        out.drawCircle({x:fromX,y:fromY,size:8.8,color:lib.rgb(1,1,1),borderColor:red,borderWidth:2});
        out.drawText(tag,{x:fromX-(tag.length>1?5:2.6),y:fromY-3.4,size:8.5,font:bold,color:red});
        // Correspondance établie par le numéro rouge, sans ligne qui traverse le CV.
      }
      out.drawText('Conseils automatiques a verifier.',{x:W+13,y:18,size:8,font:regular,color:muted});
      out.drawText('Document original conserve a gauche.',{x:W+13,y:8,size:8,font:regular,color:muted});
    }
    const bytes=await output.save({useObjectStreams:false});return new Blob([bytes],{type:'application/pdf'});
  }
  window.IFCVAutoCV = {pdfLines,analyze,annotatePdf};
  if(typeof penStudio !== 'undefined') {
    let review=null,pdfDocument=null,documentBytes=null,renderCounter=0;
    function report(text,bad=false){const node=$a('autoCVStatus');if(node){node.textContent=text;node.classList.toggle('error',bad)}}
    function escape(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
    function renderNotes(){const el=$a('autoCVNotes');if(!el)return;
      if(!review){el.innerHTML='<p class="muted">Importe un CV PDF pour démarrer le diagnostic.</p>';return;}
      el.innerHTML=review.notes.map(n=>`<div class="autoCV-note"><span class="autoCV-count">${n.number}</span><div><strong>${escape(n.title)}</strong><small>${escape(n.severity)}</small><p>${escape(n.text)}</p>${n.basis?`<details><summary>Pourquoi ce conseil ?</summary><p>${escape(n.basis)}</p></details>`:''}</div></div>`).join('');
      $a('autoCVCount').textContent=review.notes.length+' annotation'+(review.notes.length>1?'s':'')+' générée'+(review.notes.length>1?'s':'')+' automatiquement';
    }
    function drawOverlay(){const marks=$a('autoCVMarks'),canvas=$a('autoCVCanvas');if(!marks||!canvas)return;marks.replaceChildren();
      const page=Number($a('autoCVPage')?.value)||1;
      for(const n of (review?.notes||[]).filter(n=>n.page===page)){
        const el=document.createElement('span');el.className='autoCV-marker';el.textContent=String(n.number);el.title=n.title+': '+n.text;el.style.left=(n.u*100)+'%';el.style.top=(n.v*100)+'%';el.setAttribute('aria-label',el.title);marks.append(el);
      }
    }
    async function drawPage(){const canvas=$a('autoCVCanvas');if(!canvas||!pdfDocument)return;const version=++renderCounter;
      const n=Number($a('autoCVPage').value)||1;
      const page=await pdfDocument.getPage(n);const vp=page.getViewport({scale:1});const wrap=canvas.parentElement;
      const width=Math.min(680,Math.max(230,wrap.getBoundingClientRect().width-4));const scale=width/vp.width,viewport=page.getViewport({scale});
      const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(viewport.width*dpr);canvas.height=Math.round(viewport.height*dpr);
      canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';wrap.style.aspectRatio=vp.width+'/'+vp.height;
      const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
      await page.render({canvasContext:ctx,viewport}).promise;if(version===renderCounter)drawOverlay();
    }
    async function scan(file){if(!file){report('Choisis un fichier PDF.',true);return;}
      if(!/\.pdf$/i.test(file.name) && file.type!=='application/pdf'){report('Ce module annote uniquement les PDF originaux.',true);return;}
      if(file.size>8*1024*1024){report('Le PDF doit faire moins de 8 Mo.',true);return;}
      $a('autoCVSave').disabled=true;report('Lecture et analyse du document en cours…');review=null;pdfDocument=null;renderNotes();
      try{
        const lib=await v67LoadPDF();documentBytes=new Uint8Array(await file.arrayBuffer());
        const doc=await lib.getDocument({data:new Uint8Array(documentBytes)}).promise;
        if(doc.numPages>12)throw Error('Ce module prend en charge au maximum 12 pages.');
        const pages=[];
        for(let i=1;i<=doc.numPages;i++){
          const page=await doc.getPage(i),vp=page.getViewport({scale:1}),content=await page.getTextContent();
          pages.push({width:vp.width,height:vp.height,lines:pdfLines(content.items,vp.width,vp.height,i)});
        }
        const diagnosis=analyze(pages,state.formation||'');
        if(!diagnosis.readable)throw Error(diagnosis.reason);
        if(typeof v65CheckTextQuality === 'function' && !v65CheckTextQuality(diagnosis.raw).ok)throw Error('La lecture du PDF semble incohérente : les remarques automatiques sont désactivées.');
        // Écarter les PDF tournés : les repères pourraient sinon être décalés.
        for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i);if(pg.rotate%360!==0)throw Error('Le PDF comporte une page tournée : réexporte-le avec les pages redressées avant analyse.');}
        pdfDocument=doc;review={...diagnosis,pages};state.penOriginalFile=file;
        $a('autoCVFileName').textContent=file.name;
        $a('autoCVPage').innerHTML=pages.map((_,i)=>`<option value="${i+1}">Page ${i+1}</option>`).join('');
        $a('autoCVPage').disabled=false;
        renderNotes();await drawPage();
        $a('autoCVSave').disabled=false;
        report(`${review.notes.length} remarques automatiques placées sur ${doc.numPages} page(s). Vérifie le diagnostic avant de télécharger.`);
      }catch(e){review=null;pdfDocument=null;state.penOriginalFile=null;renderNotes();report('Analyse impossible : '+e.message,true);}
    }
    function studio(){
      if(!state.started){formIntro();return;}
      modal('ATELIER CV · Analyse automatique','Mon CV corrigé par IFCV QUEST','Le jeu détecte les points à améliorer et prépare lui-même les annotations rouges.','🖍',`
      <div class="autoCV-intro"><b>Tu n’as aucune annotation à rédiger.</b> Importe ton CV PDF : IFCV QUEST cherche les rubriques, les coordonnées, les périodes et les éléments à préciser. Il produit un PDF conservant le CV original avec les conseils rouges en marge.</div>
      <div class="autoCV-toolbar"><label for="autoCVInput">Importer mon CV PDF <input id="autoCVInput" type="file" accept=".pdf,application/pdf"></label><span id="autoCVFileName">${state.penOriginalFile?escape(state.penOriginalFile.name):'Aucun CV importé'}</span></div>
      <div class="autoCV-grid"><section class="autoCV-preview"><div class="autoCV-ptop"><strong>📄 Mon CV original</strong><label>Page <select id="autoCVPage" disabled><option value="1">1</option></select></label></div><div class="autoCV-sheet"><canvas id="autoCVCanvas"></canvas><div id="autoCVMarks" aria-label="Annotations automatiques en rouge"></div></div><p>Les numéros rouges indiquent les endroits où un conseil a été généré. Le PDF final présente les remarques en rouge, en marge, sans masquer le CV.</p></section>
      <section class="autoCV-review"><h3 id="autoCVCount">Diagnostic en attente</h3><div id="autoCVNotes"><p class="muted">Importe un CV PDF pour démarrer.</p></div><button class="btn" id="autoCVSave" disabled>⬇ Télécharger mon CV annoté automatiquement</button><p class="autoCV-caution">Analyse par règles, sans IA générative ni OCR. Les conseils peuvent être incomplets ou inexacts. Aucune faute ni compétence non vérifiée n’est inventée, et ton CV original n’est pas modifié.</p></section></div>
      <p id="autoCVStatus" class="autoCV-status" aria-live="polite">En attente de ton CV PDF.</p>`);
      $a('autoCVInput').onchange=e=>scan(e.target.files?.[0]);
      $a('autoCVPage').onchange=drawPage;
      $a('autoCVSave').onclick=async()=>{if(!review||!documentBytes)return;const btn=$a('autoCVSave');btn.disabled=true;report('Création des remarques rouges sur une copie du PDF…');
        try{const lib=await v67LoadPDFLib();const pdf=await annotatePdf(documentBytes,review.pages,review.notes,lib);const url=URL.createObjectURL(pdf);const a=document.createElement('a');a.href=url;a.download=(state.penOriginalFile?.name||'CV').replace(/\.pdf$/i,'')+'_diagnostic_IFCV_QUEST.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);report('CV annoté téléchargé. Tes informations et le fichier original n’ont pas été modifiés.');}
        catch(e){report('Export impossible : '+e.message,true)}finally{btn.disabled=!review;}
      };
      if(state.penOriginalFile)scan(state.penOriginalFile);
    }
    penStudio=studio;
    window.IFCVAutoCV.open=studio;
  }
})();