'use strict';
const B=BrandKit,$=id=>document.getElementById(id);
const SAMPLE=[{id:'night-01',title:'海风与磁带',date:'2026-12-06',time:'19:30',venue:'虚构场地 · 北岸音乐空间',performer:'The Quiet Lines / 蓝调计划',cta:'现场见 / SEE YOU THERE'},{id:'night-02',title:'冬夜即兴',date:'2026-12-13',time:'20:00',venue:'虚构场地 · 北岸音乐空间',performer:'Late Hours Trio / 山野来信',cta:'让声音留在此刻'}];
const TEMPLATE='id,title,date,time,venue,performer,cta\nevent-001,海风与磁带,2026-12-06,19:30,虚构场地 · 北岸音乐空间,The Quiet Lines / 蓝调计划,现场见\nevent-002,冬夜即兴,2026-12-13,20:00,虚构场地 · 北岸音乐空间,Late Hours Trio / 山野来信,让声音留在此刻\n';
let state={config:{...B.DEFAULT},events:SAMPLE.map(x=>({...x}))},active=0,format='poster',revision=0,busy=false,pngBusy=false,previewURL=null,lastUndo=null;
function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function save(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function snapshot(){return JSON.stringify(B.backup(state.config,state.events));}
function beforeStructuralChange(){lastUndo=snapshot();}
function lock(value){busy=value;for(const button of document.querySelectorAll('.format'))button.disabled=value;for(const id of ['save','add','delete','undo','brandName','tagline','background','accent','motif','eventId','title','date','time','venue','performer','cta'])$(id).disabled=value;render();}
const configMap={brandName:'brand',tagline:'tagline',background:'background',accent:'accent',motif:'motif'};
const eventMap={eventId:'id',title:'title',date:'date',time:'time',venue:'venue',performer:'performer',cta:'cta'};
function syncInputs(){for(const [id,key] of Object.entries(configMap))$(id).value=state.config[key];const current=state.events[active];for(const [id,key] of Object.entries(eventMap)){$(id).value=current?current[key]:'';$(id).disabled=busy||!current;}}
function render(){
 const audit=B.preflight(state.config,state.events);const current=state.events[active],row=audit.rows[active];const canCurrent=!!current&&!!row&&row.exportable;
 $('event-number').textContent=state.events.length?(active+1)+' / '+state.events.length:'无活动';$('count').textContent=state.events.length;$('error-count').textContent=audit.errors.length;$('warning-count').textContent=audit.warnings.length;$('asset-count').textContent=state.events.length*3;
 $('audit-badge').textContent=audit.errors.length?'有阻断项，暂停整包导出':audit.warnings.length?'可以导出，请查看提示':'模板预检未发现阻断';$('audit-badge').classList.toggle('blocked',audit.errors.length>0);
 $('zip').disabled=busy||audit.errors.length>0;$('svg').disabled=busy||!canCurrent;$('png').disabled=busy||pngBusy||!canCurrent;$('report').disabled=busy;$('undo').disabled=busy||!lastUndo;$('add').disabled=busy||state.events.length>=30;$('delete').disabled=busy||!current;
 $('dimensions').textContent=B.FORMATS[format].width+' × '+B.FORMATS[format].height+' / SVG';
 const p=audit.palette;$('palette-note').textContent=p?(p.accentAdjusted?'强调色对比度 '+p.accentContrast.toFixed(2)+':1，已自动改用 '+p.accent+'；正文对比度 '+p.textContrast.toFixed(2)+':1。':'正文对比度 '+p.textContrast.toFixed(2)+':1 · 强调色 '+p.accentContrast.toFixed(2)+':1。'):'请先输入合法颜色。';
 if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}
 if(canCurrent){try{const svg=B.configSVG(state.config,current,format);previewURL=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));$('preview').src=previewURL;$('preview').alt=current.title+' · '+B.FORMATS[format].name;$('preview').hidden=false;$('preview-empty').hidden=true;}catch(err){$('preview').hidden=true;$('preview-empty').hidden=false;}}
 else{$('preview').hidden=true;$('preview').removeAttribute('src');$('preview-empty').hidden=false;}
 const list=$('event-list');list.replaceChildren();if(!state.events.length)list.append(node('p','','还没有活动，点击“新增活动”开始。'));
 state.events.forEach((event,i)=>{const card=node('button','event-card'+(i===active?' active':'')+(audit.rows[i]&&!audit.rows[i].exportable?' has-error':''));card.disabled=busy;card.append(node('span','row-tag',String(i+1).padStart(2,'0')+' / '+(audit.rows[i]&&audit.rows[i].exportable?'可生成':'待修正')),node('strong','',event.title||'未填写标题'),node('small','',event.date+' · '+event.venue));card.onclick=()=>{active=i;syncInputs();render();};list.append(card);});
 const issues=$('issues');issues.replaceChildren();for(const item of [...audit.errors.map(x=>({...x,blocking:true})),...audit.warnings])issues.append(node('div','issue'+(item.blocking?' block':''),(item.row?'活动 '+item.row:'品牌/清单')+' · '+item.field+'：'+item.message));
 if(!audit.errors.length&&!audit.warnings.length)issues.append(node('p','clear','当前模板预检未发现阻断或颜色提示。仍请逐张查看最终字体、排版与平台裁切。'));
}
for(const [id,key] of Object.entries(configMap))$(id).addEventListener('input',()=>{state.config[key]=$(id).value;revision++;render();});
for(const [id,key] of Object.entries(eventMap))$(id).addEventListener('input',()=>{if(!state.events[active])return;state.events[active][key]=$(id).value;revision++;render();});
for(const button of document.querySelectorAll('.format'))button.onclick=()=>{if(busy)return;format=button.dataset.format;document.querySelectorAll('.format').forEach(n=>n.classList.toggle('active',n===button));revision++;render();};
$('add').onclick=()=>{if(busy||state.events.length>=30)return;try{beforeStructuralChange();}catch{status('当前字段含不支持的控制字符，请先修正。',true);return;}let i=1;while(state.events.some(e=>e.id==='event-'+String(i).padStart(3,'0')))i++;state.events.push({id:'event-'+String(i).padStart(3,'0'),title:'新的现场',date:'2026-12-20',time:'19:30',venue:'请填写场地',performer:'',cta:''});active=state.events.length-1;revision++;syncInputs();render();status('已新增活动。请修改日期、场地和标题；默认内容不是实际安排。');};
$('delete').onclick=()=>{if(busy||!state.events[active])return;try{beforeStructuralChange();}catch{status('当前字段含不支持的控制字符，请先修正。',true);return;}state.events.splice(active,1);active=Math.max(0,Math.min(active,state.events.length-1));revision++;syncInputs();render();status('活动已移除，可用“撤销上次导入/增删”恢复。');};
$('undo').onclick=()=>{if(busy||!lastUndo)return;try{const next=B.validateBackup(JSON.parse(lastUndo));lastUndo=null;state={config:next.config,events:next.events};active=0;revision++;syncInputs();render();status('已恢复上次结构修改前的工作区。');}catch{status('无法恢复撤销记录，当前工作区未改变。',true);}};
$('sample').onclick=()=>save('events-template.csv','\ufeff'+TEMPLATE,'text/csv;charset=utf-8');
async function importFile(file,type){
 if(!file)return;const stamp=++revision;lock(true);status(type==='csv'?'正在读取活动清单，原工作区暂时保留…':'正在校验备份，原工作区暂时保留…');
 try{
  if(file.size>(type==='csv'?262144:524288))throw Error('文件超过大小限制');let text;try{text=await file.text();}catch{throw Error('无法读取文件');}if(stamp!==revision)return;
  let candidate;if(type==='csv')candidate={config:{...state.config},events:B.parseCSV(text)};else{let raw;try{raw=JSON.parse(text);}catch{throw Error('不是有效的 JSON 备份');}const next=B.validateBackup(raw);candidate={config:next.config,events:next.events};}
  if(stamp!==revision)return;
  beforeStructuralChange();state=candidate;active=0;syncInputs();status(type==='csv'?'活动清单已导入，请检查逐行预检结果；可撤销导入。':'品牌与活动备份已恢复，请检查预检结果。');
 }catch(err){if(stamp===revision)status('导入失败：'+err.message+'。原工作区保持不变。',true);}
 finally{if(stamp===revision){lock(false);syncInputs();}}
}
$('csv').onchange=async e=>{await importFile(e.target.files[0],'csv');e.target.value='';};$('restore').onchange=async e=>{await importFile(e.target.files[0],'backup');e.target.value='';};
$('save').onclick=()=>{try{save('brand-kit-workspace.json',JSON.stringify(B.backup(state.config,state.events),null,2),'application/json');status('已请求保存工作区。备份包含品牌文案与活动信息，分享前请检查隐私。');}catch(err){status('无法备份：'+err.message,true);}};
$('report').onclick=()=>save('brand-kit-preflight.json',JSON.stringify(B.preflight(state.config,state.events),null,2),'application/json');
$('svg').onclick=()=>{try{if(busy)return;const audit=B.preflight(state.config,state.events);if(!audit.rows[active]||!audit.rows[active].exportable)throw Error('请先修正当前活动');save('event-'+String(active+1).padStart(3,'0')+'-'+format+'.svg',B.configSVG(state.config,state.events[active],format),'image/svg+xml');status('已请求下载 SVG。请查看最终字体与画面后再发布。');}catch(err){status(err.message,true);}};
$('zip').onclick=()=>{try{if(busy)return;const files=B.kitFiles(state.config,state.events);save('brand-kit-events.zip',B.zip(files),'application/zip');status('已请求下载 '+state.events.length+' 场活动的 SVG 套件，含活动映射与预检记录。');}catch(err){status('导出失败：'+err.message,true);}};
$('png').onclick=async()=>{
 if(busy||pngBusy)return;const stamp=revision,chosen=active,chosenFormat=format;let url;pngBusy=true;render();status('正在本地生成 PNG…');
 try{const audit=B.preflight(state.config,state.events);if(!audit.rows[chosen]||!audit.rows[chosen].exportable)throw Error('请先修正当前活动');const svg=B.configSVG(state.config,state.events[chosen],chosenFormat);url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('浏览器无法渲染 SVG'));image.src=url;});if(stamp!==revision){status('内容已变化，本次 PNG 下载已取消，请重新导出。');return;}const canvas=document.createElement('canvas');canvas.width=B.FORMATS[chosenFormat].width;canvas.height=B.FORMATS[chosenFormat].height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器不支持 Canvas 导出');ctx.drawImage(image,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(stamp!==revision){status('内容已变化，本次 PNG 下载已取消，请重新导出。');return;}if(!blob)throw Error('PNG 生成失败');save('event-'+String(chosen+1).padStart(3,'0')+'-'+chosenFormat+'.png',blob,'image/png');status('已请求下载 PNG，请检查实际字体与排版。');}
 catch(err){status('PNG 未导出：'+err.message+'。可以尝试 SVG 导出。',true);}finally{if(url)URL.revokeObjectURL(url);pngBusy=false;render();}
};
for(const label of document.querySelectorAll('label.button[for]')){label.tabIndex=0;label.setAttribute('role','button');label.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$(label.htmlFor).click();}});}
syncInputs();render();
