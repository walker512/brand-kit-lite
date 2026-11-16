/* Original geometric event-kit generator. MIT. No network or dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BrandKit=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='0.2.0';
const FORMATS={poster:{name:'演出海报',width:1080,height:1350},story:{name:'竖屏预告',width:1080,height:1920},banner:{name:'横幅',width:1500,height:500}};
const DEFAULT={brand:'夜航声场',tagline:'INDEPENDENT SOUNDS · LIVE SERIES',background:'#151827',accent:'#c9f36b',motif:'pulse'};
const FIELDS=['id','title','date','time','venue','performer','cta'];
const ALIASES={id:['id','编号'],title:['title','标题','活动名称'],date:['date','日期'],time:['time','时间'],venue:['venue','地点','场地'],performer:['performer','艺人','嘉宾'],cta:['cta','行动文案']};
function chars(s){return Array.from(String(s));}
function escapeXML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function safeText(s){return typeof s==='string'&&s.length<=1000&&!/[\u0000-\u001f\u007f\ufffe\uffff]/.test(s)&&!chars(s).some(c=>{const n=c.codePointAt(0);return n>=0xd800&&n<=0xdfff;});}
function hex(c){return typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);}
function luminance(c){if(!hex(c))throw Error('颜色需要 #RRGGBB');const rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function palette(config){const bg=config.background;const text=contrast('#ffffff',bg)>=contrast('#000000',bg)?'#ffffff':'#000000';return {background:bg,text,accent:contrast(config.accent,bg)>=4.5?config.accent:text,requestedAccent:config.accent,textContrast:contrast(text,bg),accentContrast:contrast(config.accent,bg),accentAdjusted:contrast(config.accent,bg)<4.5};}
function dateOK(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
function measure(s){return chars(s).reduce((sum,c)=>sum+(/[\u0000-\u007f]/.test(c)?(.68):1),0);}
function wrap(s,units,maxLines){
 const lines=[];let line='';
 for(const word of chars(s.trim())){if(line&&measure(line+word)>units){lines.push(line.trimEnd());line=word.trimStart();}else line+=word;}
 if(line)lines.push(line.trimEnd());return {lines,overflow:lines.length>maxLines};
}
function validate(config,events){
 const issues=[];const add=(row,field,message)=>issues.push({row,field,message});
 if(!config||typeof config!=='object'||!Array.isArray(events))return [{row:0,field:'data',message:'输入结构无效'}];
 for(const [field,max,required] of [['brand',24,true],['tagline',52,false]]){const v=config[field];if(!safeText(v)||chars(v).length>max||(required&&!v.trim()))add(0,field,`${field} 需要${required?'非空、':''}最多 ${max} 个字符，且不含换行/控制字符`);}
 for(const f of ['background','accent'])if(!hex(config[f]))add(0,f,'请输入完整的 #RRGGBB 颜色');
 if(!['pulse','orbit','grid'].includes(config.motif))add(0,'motif','不支持的图案');
 if(events.length<1||events.length>30)add(0,'events','需要 1–30 个活动');
 const ids=new Set();
 events.forEach((event,i)=>{
  if(!event||typeof event!=='object'){add(i+1,'row','活动结构无效');return;}
  for(const [field,max,required] of [['id',40,true],['title',40,true],['date',10,true],['time',5,false],['venue',42,true],['performer',60,false],['cta',28,false]]){const v=event[field];if(!safeText(v)||chars(v).length>max||(required&&!v.trim()))add(i+1,field,`${field} 需要${required?'非空、':''}最多 ${max} 个字符，且不含换行/控制字符`);}
  if(typeof event.id==='string'){if(ids.has(event.id))add(i+1,'id','活动编号重复');ids.add(event.id);}
  if(typeof event.date==='string'&&!dateOK(event.date))add(i+1,'date','日期必须是有效的 YYYY-MM-DD');
  if(typeof event.time==='string'&&event.time&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(event.time))add(i+1,'time','时间必须是 24 小时制 HH:MM，或留空');
  if(typeof event.title==='string'&&wrap(event.title,13.2,4).overflow)add(i+1,'title','标题超过横幅的排版容量，请缩短');
 });return issues;
}
function parseCSV(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>262144)throw Error('CSV 不能超过 256 KiB');
 const input=text.replace(/^\ufeff/,'');const rows=[];let row=[],cell='',quoted=false,closed=false;
 const pushCell=()=>{row.push(cell);cell='';closed=false;};const pushRow=()=>{pushCell();if(row.some(v=>v!==''))rows.push(row);row=[];if(rows.length>31)throw Error('最多导入 30 个活动');};
 for(let i=0;i<input.length;i++){
  const c=input[i];if(quoted){if(c==='"'){if(input[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
  else if(c==='"'){if(cell||closed)throw Error('CSV 引号格式不正确');quoted=true;}
  else if(c===',')pushCell();else if(c==='\n'||c==='\r'){if(c==='\r'&&input[i+1]==='\n')i++;pushRow();}
  else{if(closed)throw Error('引号结束后只能是逗号或换行');cell+=c;}
  if(cell.length>1000)throw Error('单个单元格超过 1000 字符');
 }
 if(quoted)throw Error('CSV 引号没有闭合');if(cell||row.length||closed)pushRow();if(rows.length<2)throw Error('CSV 需要表头和至少一个活动');
 const header=rows.shift().map(v=>v.trim().toLowerCase());const map={};
 for(let i=0;i<header.length;i++){const key=FIELDS.find(k=>ALIASES[k].includes(header[i]));if(!key)throw Error('不支持的列：'+header[i]);if(map[key]!==undefined)throw Error('重复或有歧义的列：'+key);map[key]=i;}
 for(const key of ['title','date','venue'])if(map[key]===undefined)throw Error('缺少必填列：'+key);
 return rows.map((r,i)=>{if(r.length!==header.length)throw Error('第 '+(i+2)+' 行列数不一致');const item={};for(const k of FIELDS)item[k]=(map[k]===undefined?'':r[map[k]]).trim();if(!item.id)item.id='event-'+String(i+1).padStart(3,'0');return item;});
}
function configSVG(config,event,format){
 const errors=validate(config,[event]);if(errors.length)throw Error(errors[0].message);if(!FORMATS[format])throw Error('不支持的尺寸');
 const {width:w,height:h}=FORMATS[format],p=palette(config);const wide=format==='banner';const m=wide?62:76;const mark=wide?{x:1190,y:250,r:190}:{x:w*.74,y:h*.31,r:w*.38};
 let seed=0;for(const c of chars(config.brand))seed=(seed*31+c.codePointAt(0))>>>0;
 const shapes=[];
 if(config.motif==='pulse'){for(let i=0;i<9;i++){const t=.25+((seed>>>((i%4)*8))%79+i*17)%100/100*.70;const bh=mark.r*1.6*t;shapes.push(`<rect x="${(mark.x-mark.r+i*mark.r*.23).toFixed(1)}" y="${(mark.y-bh/2).toFixed(1)}" width="${(mark.r*.10).toFixed(1)}" height="${bh.toFixed(1)}" rx="${(mark.r*.05).toFixed(1)}" fill="${p.accent}" opacity="0.55"/>`);}}
 if(config.motif==='orbit'){for(let i=0;i<5;i++)shapes.push(`<circle cx="${mark.x}" cy="${mark.y}" r="${mark.r*(.35+i*.18)}" fill="none" stroke="${p.accent}" stroke-width="${i===2?16:3}" opacity="${i===2?.6:.28}"/>`);}
 if(config.motif==='grid'){for(let x=0;x<6;x++)for(let y=0;y<6;y++)shapes.push(`<circle cx="${mark.x-mark.r+x*mark.r*.4}" cy="${mark.y-mark.r+y*mark.r*.4}" r="${5+((seed+x*13+y*7)%17)}" fill="${p.accent}" opacity=".42"/>`);}
 function text(s,x,y,size,color,maxWidth,weight=400){const natural=Math.max(1,measure(s)*size);const fit=Math.min(maxWidth,natural);return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" font-family="Arial, 'Noto Sans CJK SC', sans-serif" textLength="${fit.toFixed(1)}" lengthAdjust="spacingAndGlyphs">${escapeXML(s)}</text>`;}
 const items=[];items.push(text(config.brand,m,wide?74:90,wide?27:32,p.text,wide?600:850,700));
 if(config.tagline)items.push(text(config.tagline,m,wide?106:126,wide?13:17,p.text,wide?650:850));
 const titleSize=wide?63:88,titleTop=wide?190:(format==='story'?h*.49:h*.46),titleWidth=wide?850:w-2*m;
 const titleLines=wrap(event.title,wide?13.2:10.4,4).lines;
 titleLines.forEach((line,i)=>items.push(text(line,m,titleTop+i*titleSize*1.1,titleSize,p.text,titleWidth,800)));
 const tailTop=wide?390:Math.max(titleTop+titleLines.length*titleSize*1.1+60,h*.80);
 // Banner title may need 4 lines; the layout rejects overlap rather than clipping.
 if(wide&&titleTop+(titleLines.length-1)*titleSize*1.1>335)throw Error('标题在横幅中超过 3 行，请缩短至可排版长度');
 const dateText=event.date.replace(/-/g,'.')+(event.time?'  /  '+event.time:'');
 items.push(text(dateText,m,tailTop,wide?26:38,p.accent,wide?840:w-2*m,700));
 const venueSize=wide?20:26;items.push(text(event.venue,m,tailTop+(wide?36:50),venueSize,p.text,wide?840:w-2*m,500));
 if(event.performer){if((wide?840:w-2*m)/(measure(event.performer)*(wide?16:22))<.75)throw Error('艺人文字需要过度压缩，请缩短');items.push(text(event.performer,m,tailTop+(wide?67:94),wide?16:22,p.text,wide?840:w-2*m));}
 if(event.cta&&!wide)items.push(text(event.cta,m,h-56,20,p.accent,w-2*m,600));
 const textEnd=tailTop+(event.performer?(wide?67:94):(wide?36:50));if(textEnd>h-86&&!wide)throw Error('标题与活动信息重叠，请缩短标题');
 const ruleY=wide?352:tailTop-28;items.push(`<line x1="${m}" y1="${ruleY}" x2="${wide?900:w-m}" y2="${ruleY}" stroke="${p.text}" opacity=".18"/>`);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${escapeXML(config.brand+' · '+event.title)}</title><desc>Original geometric event artwork. Event information supplied by the user.</desc><rect width="${w}" height="${h}" fill="${p.background}"/><defs><clipPath id="motif-area"><rect x="${wide?960:0}" y="${wide?0:160}" width="${wide?540:w}" height="${wide?h:Math.max(0,titleTop-titleSize-200)}"/></clipPath></defs><g clip-path="url(#motif-area)">${shapes.join('')}</g>${items.join('')}</svg>`;
}
function allIssues(config,events){const list=validate(config,events);if(!Array.isArray(events))return list;events.forEach((e,i)=>{if(list.some(x=>x.row===0||x.row===i+1))return;for(const format of Object.keys(FORMATS)){try{configSVG(config,e,format);}catch(err){list.push({row:i+1,field:'layout',message:FORMATS[format].name+'：'+err.message});}}});return list;}
function preflight(config,events){
 const errors=allIssues(config,events);const warnings=[];let p=null;
 if(hex(config.background)&&hex(config.accent))p=palette(config);
 if(Array.isArray(events))events.forEach((event,i)=>{
  if(p&&p.accentAdjusted)warnings.push({row:i+1,field:'contrast',message:'请求的强调色对比度 '+p.accentContrast.toFixed(2)+':1 低于 4.5:1，文字与图案自动改用 '+p.accent+'。'});
  if(event&&typeof event.venue==='string'&&measure(event.venue)*26>928)warnings.push({row:i+1,field:'venue',message:'场地文字需按模板收窄；请检查字形与可读性。'});
  if(event&&typeof event.performer==='string'&&measure(event.performer)*22>928)warnings.push({row:i+1,field:'performer',message:'艺人文字需按模板收窄；请检查字形与可读性。'});
 });
 return {method:'Deterministic character-width estimate and fixed template geometry, not Canvas-measured font overflow.',errors,warnings,rows:Array.isArray(events)?events.map((e,i)=>({row:i+1,id:e&&e.id||'',exportable:!errors.some(x=>x.row===0||x.row===i+1),errors:errors.filter(x=>x.row===0||x.row===i+1),warnings:warnings.filter(x=>x.row===i+1)})):[],palette:p};
}
function backup(config,events){return validateBackup({schema:'brand-kit-lite',version:VERSION,config,events});}
function validateBackup(value){
 if(!value||value.schema!=='brand-kit-lite'||value.version!==VERSION||!value.config||typeof value.config!=='object'||!Array.isArray(value.events)||value.events.length>30)throw Error('不是支持的品牌套件备份');
 const config={};for(const key of Object.keys(DEFAULT)){if(!safeText(value.config[key]))throw Error('品牌配置字段无效');config[key]=value.config[key];}
 const events=value.events.map(e=>{const out={};if(!e||typeof e!=='object')throw Error('活动数据无效');for(const key of FIELDS){if(!safeText(e[key]))throw Error('活动字段无效');out[key]=e[key];}return out;});
 return {schema:'brand-kit-lite',version:VERSION,config,events};
}
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function zip(files){
 if(!Array.isArray(files)||files.length>100)throw Error('导出文件数超限');let offset=0;const parts=[],central=[];const enc=new TextEncoder();const seen=new Set();
 for(const f of files){if(!/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(f.name)||seen.has(f.name))throw Error('导出文件名无效或重复');seen.add(f.name);const name=enc.encode(f.name),data=enc.encode(f.text);if(data.length>1048576)throw Error('单导出文件过大');const crc=crc32(data);const local=new Uint8Array(30+name.length);const v=new DataView(local.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(10,0,true);v.setUint16(12,0x21,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);local.set(name,30);parts.push(local,data);
 const cd=new Uint8Array(46+name.length);const cv=new DataView(cd.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(12,0,true);cv.setUint16(14,0x21,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);cd.set(name,46);central.push(cd);offset+=local.length+data.length;
 }
 const csize=central.reduce((sum,b)=>sum+b.length,0);const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,csize,true);ev.setUint32(16,offset,true);const out=new Uint8Array(offset+csize+22);let at=0;for(const p of [...parts,...central,end]){out.set(p,at);at+=p.length;}return out;
}
function kitFiles(config,events){const errors=allIssues(config,events);if(errors.length)throw Error('请先修正全部输入/排版问题');const files=[];events.forEach((e,i)=>{for(const format of Object.keys(FORMATS))files.push({name:'event-'+String(i+1).padStart(3,'0')+'-'+format+'.svg',text:configSVG(config,e,format)});});const p=palette(config);files.push({name:'manifest.json',text:JSON.stringify({schema:'brand-kit-export',version:VERSION,config,events,palette:p,preflight:preflight(config,events),formats:FORMATS,notice:'User-provided event data. Original templates are not trademark clearance. Review all artwork before publishing.'},null,2)});files.push({name:'README.txt',text:'Brand Kit Lite: SVG event artwork\nFilenames use row order, not user IDs. manifest.json maps each row to its event.\nOriginal geometric templates and code: MIT License, Copyright (c) 2026 walker512. See the application LICENSE for full terms. Your supplied content is not relicensed by this tool. No third-party fonts or artwork are bundled. You are responsible for rights to names and supplied content. Check names, rights, dates, typography and platform cropping before publication.\nThe manifest contains event information: do not share private drafts accidentally.\n'});return files;}
return {VERSION,FORMATS,DEFAULT,FIELDS,escapeXML,hex,luminance,contrast,palette,dateOK,measure,wrap,validate,parseCSV,configSVG,allIssues,preflight,backup,validateBackup,crc32,zip,kitFiles};
});
