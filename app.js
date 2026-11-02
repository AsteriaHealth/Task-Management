const STORAGE_KEY='asteriaCiHubV3';
const LEGACY_KEY='asteriaProjects';

const seedState={
  selectedWorkspaceId:'ci',
  workspaces:[
    {id:'ci',name:'Continuous Improvement',projects:[
      {id:'p-sops',name:'SOPs',owner:'William',email:'william@asteria.com',due:'2026-11-30',priority:'High',notes:'Draft, review, approve and release priority SOPs with clear ownership at every stage.',collapsed:false,tasks:[
        {id:'t1',title:'IOPQ Drafted',status:'done',due:'2026-11-04',owner:'William',email:'william@asteria.com',notes:'Complete IOPQ draft package.',subs:[{id:'s1',title:'Draft protocol',done:true},{id:'s2',title:'Internal review',done:true}]},
        {id:'t2',title:'Open Change Control',status:'progress',due:'2026-11-08',owner:'William / QA',email:'',notes:'Open and route the change control before final SOP approval.',subs:[{id:'s3',title:'Create change control record',done:true},{id:'s4',title:'QA review',done:false}]},
        {id:'t3',title:'SOP Drafted',status:'progress',due:'2026-11-12',owner:'William',email:'william@asteria.com',notes:'Complete controlled first draft.',subs:[{id:'s5',title:'Draft content',done:true},{id:'s6',title:'Verify references',done:false}]},
        {id:'t4',title:'SOP Reviewed',status:'todo',due:'2026-11-17',owner:'William → John & Claudia',email:'',notes:'Route to technical and quality reviewers.',subs:[]},
        {id:'t5',title:'SOP Approved',status:'todo',due:'2026-11-21',owner:'William / Claudia / John',email:'',notes:'Capture final approvals.',subs:[]},
        {id:'t6',title:'Training Complete',status:'todo',due:'2026-11-27',owner:'Department',email:'',notes:'Train affected employees and document acknowledgements.',subs:[]}
      ]},
      {id:'p-label',name:'Label Counter',owner:'CI Team',email:'ci@asteria.com',due:'2026-12-12',priority:'Medium',notes:'Track label counter improvement activities and qualification.',collapsed:false,tasks:[
        {id:'t7',title:'Helixa Torque Measurement Device',status:'progress',due:'2026-11-14',owner:'William',email:'',notes:'',subs:[]},
        {id:'t8',title:'Vialing Expansion',status:'todo',due:'2026-11-21',owner:'CI Team',email:'',notes:'',subs:[]},
        {id:'t9',title:'MH2U Vialing Machine',status:'todo',due:'2026-11-28',owner:'CI Team',email:'',notes:'',subs:[]}
      ]},
      {id:'p-fill',name:'Fill Line Modifications',owner:'Engineering / CI',email:'',due:'2026-12-18',priority:'High',notes:'Capture line modification work without losing follow-up actions.',collapsed:false,tasks:[]}
    ]}
  ]
};

let state=loadState();
let currentView='board';
let currentTaskRef=null;
let searchTerm='';
let statusFilter='all';

const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));

function cloneSeed(){return JSON.parse(JSON.stringify(seedState));}
function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(saved?.workspaces?.length)return saved;
    const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null');
    if(Array.isArray(legacy)&&legacy.length){
      const migrated=cloneSeed();
      migrated.workspaces[0].projects=legacy.map(p=>({
        id:String(p.id||uid('p')),name:p.name||'Project',owner:p.owner||'',email:p.email||'',due:p.due||'',priority:p.priority||'Medium',notes:p.notes||'',collapsed:false,
        tasks:(p.tasks||[]).map(t=>({id:uid('t'),title:t.name||'Task',status:t.done?'done':'todo',due:t.due||'',owner:p.owner||'',email:p.email||'',notes:'',subs:(t.subs||[]).map(s=>({id:uid('s'),title:s,done:false}))}))
      }));
      return migrated;
    }
  }catch(e){console.warn('Could not load saved data',e);}
  return cloneSeed();
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function workspace(){return state.workspaces.find(w=>w.id===state.selectedWorkspaceId)||state.workspaces[0];}
function allTasks(){return workspace().projects.flatMap(p=>p.tasks.map(t=>({project:p,task:t})));}
function isOverdue(t){return t.status!=='done'&&t.due&&new Date(`${t.due}T23:59:59`)<new Date();}
function fmtDate(d){if(!d)return 'No due date';return new Date(`${d}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'});}
function fmtLong(d){if(!d)return 'No target date';return new Date(`${d}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}
function statusLabel(s){return ({todo:'To do',progress:'In progress',blocked:'Blocked',done:'Done'})[s]||'To do';}
function projectPct(p){return p.tasks.length?Math.round(p.tasks.filter(t=>t.status==='done').length/p.tasks.length*100):0;}
function subtaskPct(t){return t.subs?.length?Math.round(t.subs.filter(s=>s.done).length/t.subs.length*100):0;}
function filteredTasks(p){
  return p.tasks.filter(t=>{
    const hay=[p.name,p.owner,p.email,p.notes,t.title,t.owner,t.email,t.notes,...(t.subs||[]).map(s=>s.title)].join(' ').toLowerCase();
    return (!searchTerm||hay.includes(searchTerm))&&(statusFilter==='all'||t.status===statusFilter);
  });
}

function render(){
  $('#workspaceName').textContent=workspace().name;
  renderSummary();
  renderBoard();
  renderOverview();
  renderMyWork();
  renderWorkspaceList();
}
function renderSummary(){
  const tasks=allTasks();
  const open=tasks.filter(x=>x.task.status!=='done').length;
  const progress=tasks.filter(x=>x.task.status==='progress').length;
  const overdue=tasks.filter(x=>isOverdue(x.task)).length;
  const done=tasks.filter(x=>x.task.status==='done').length;
  $('#summaryStrip').innerHTML=`
    <div class="summary-card"><span>Open tasks</span><strong>${open}</strong></div>
    <div class="summary-card"><span>In progress</span><strong>${progress}</strong></div>
    <div class="summary-card ${overdue?'danger':''}"><span>Overdue</span><strong>${overdue}</strong></div>
    <div class="summary-card"><span>Completed</span><strong>${done}</strong></div>`;
}
function renderBoard(){
  const w=workspace();
  const html=w.projects.map(p=>{
    const tasks=filteredTasks(p); const pct=projectPct(p);
    return `<section class="project-column ${p.collapsed?'collapsed':''}" data-project-id="${p.id}">
      <div class="column-header">
        <button class="collapse-project" onclick="toggleProjectCollapse('${p.id}')" title="${p.collapsed?'Expand':'Collapse'}">↔</button>
        <div class="column-title-block">
          <div class="column-title-row"><span class="column-title">${esc(p.name)}</span><span class="count-badge">(${p.tasks.length})</span></div>
          <div class="column-meta">${pct}% complete · ${esc(p.owner||'Unassigned')}</div>
        </div>
        <div class="column-actions">
          <button class="mini-icon" onclick="openProjectEdit('${p.id}')" title="Edit project">⋯</button>
          <button class="mini-icon" onclick="openNewTask('${p.id}')" title="Add task">＋</button>
        </div>
      </div>
      <div class="column-progress"><i style="width:${pct}%"></i></div>
      <div class="project-body">
        ${tasks.length?tasks.map(t=>taskCard(p,t)).join(''):`<div class="empty-column">${searchTerm||statusFilter!=='all'?'No matching tasks':'No tasks yet'}</div>`}
        <button class="add-task-card" onclick="openNewTask('${p.id}')">＋ Add task</button>
      </div>
    </section>`;
  }).join('');
  $('#projectBoard').innerHTML=html+`<button class="add-project-column" onclick="openProjectCreate()">＋ Add project</button>`;
}
function taskCard(p,t){
  const over=isOverdue(t); const completed=(t.subs||[]).filter(s=>s.done).length;
  return `<article class="task-card" onclick="openTaskDrawer('${p.id}','${t.id}')">
    <div class="task-card-top"><div class="task-title">${esc(t.title)}</div><span class="status-dot ${t.status}"></span></div>
    <div class="task-card-meta">
      <span>${esc(t.owner||'Unassigned')}</span>
      <span class="${over?'due-over':''}">${over?'Overdue · ':''}${fmtDate(t.due)}</span>
    </div>
    <div class="task-card-footer"><span class="status-pill ${t.status}">${statusLabel(t.status)}</span>${t.subs?.length?`<span class="subtask-count">${completed}/${t.subs.length} subtasks</span>`:''}</div>
  </article>`;
}
function renderOverview(){
  $('#overviewGrid').innerHTML=workspace().projects.map(p=>{
    const pct=projectPct(p); const over=p.tasks.filter(isOverdue).length;
    return `<article class="overview-card">
      <div class="overview-head"><div><h3>${esc(p.name)}</h3><div class="column-meta">${esc(p.owner||'Unassigned')} · ${fmtLong(p.due)}</div></div><span class="priority ${p.priority}">${p.priority}</span></div>
      <div class="progress-track"><i style="width:${pct}%"></i></div>
      <div class="overview-meta"><span>${pct}% complete</span><span>${p.tasks.length} tasks${over?` · ${over} overdue`:''}</span></div>
      <div class="overview-actions"><button class="secondary-button compact" onclick="jumpToProject('${p.id}')">Open</button><button class="secondary-button compact" onclick="openProjectEdit('${p.id}')">Edit</button></div>
    </article>`;
  }).join('')||`<div class="empty-column">No projects yet.</div>`;
}
function renderMyWork(){
  const email=($('#myEmailInput')?.value||'').trim().toLowerCase();
  let rows=allTasks().filter(x=>x.task.status!=='done');
  if(email)rows=rows.filter(x=>x.task.email?.toLowerCase().includes(email));
  rows.sort((a,b)=>{
    if(isOverdue(a.task)!==isOverdue(b.task))return isOverdue(a.task)?-1:1;
    return (a.task.due||'9999-12-31').localeCompare(b.task.due||'9999-12-31');
  });
  $('#myWorkList').innerHTML=rows.length?rows.map(({project:p,task:t})=>`<article class="my-work-row" onclick="openTaskDrawer('${p.id}','${t.id}')"><div><strong>${esc(t.title)}</strong><small>${esc(p.name)}</small></div><div><span>${esc(t.owner||'Unassigned')}</span><small>${esc(t.email||'')}</small></div><div><span class="status-pill ${t.status}">${statusLabel(t.status)}</span></div><div class="${isOverdue(t)?'due-over':''}">${fmtDate(t.due)}</div></article>`).join(''):`<div class="empty-column">No open tasks match this view.</div>`;
}
function renderWorkspaceList(){
  $('#workspaceList').innerHTML=state.workspaces.map(w=>`<button class="workspace-option ${w.id===state.selectedWorkspaceId?'active':''}" onclick="switchWorkspace('${w.id}')"><strong>${esc(w.name)}</strong><span>${w.projects.length} projects</span></button>`).join('');
}

window.toggleProjectCollapse=id=>{const p=workspace().projects.find(p=>p.id===id);if(!p)return;p.collapsed=!p.collapsed;save();renderBoard();};
window.openProjectCreate=()=>openProjectDialog();
window.openProjectEdit=id=>openProjectDialog(id);
window.openNewTask=id=>openTaskDialog(id);
window.openTaskDrawer=(pid,tid)=>{
  const p=workspace().projects.find(p=>p.id===pid); const t=p?.tasks.find(t=>t.id===tid); if(!p||!t)return;
  currentTaskRef={pid,tid}; const f=$('#taskForm');
  f.projectId.value=pid;f.taskId.value=tid;f.title.value=t.title||'';f.status.value=t.status||'todo';f.due.value=t.due||'';f.owner.value=t.owner||'';f.email.value=t.email||'';f.notes.value=t.notes||'';
  $('#drawerTitle').textContent=t.title;renderSubtasks(t);$('#taskDrawer').classList.add('open');$('#taskDrawer').setAttribute('aria-hidden','false');$('#drawerBackdrop').classList.remove('hidden');setTimeout(()=>f.title.focus(),120);
};
window.jumpToProject=id=>{setView('board');const p=workspace().projects.find(p=>p.id===id);if(p)p.collapsed=false;save();renderBoard();setTimeout(()=>document.querySelector(`[data-project-id="${id}"]`)?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}),50);};
window.switchWorkspace=id=>{state.selectedWorkspaceId=id;save();closeDialog($('#workspaceMenu'));render();toast('Workspace switched');};

function openProjectDialog(id=null){
  const d=$('#projectDialog'),f=$('#projectForm');f.reset();f.projectId.value='';$('#projectDialogTitle').textContent=id?'Edit Project':'New Project';
  if(id){const p=workspace().projects.find(p=>p.id===id);if(!p)return;f.projectId.value=p.id;f.name.value=p.name;f.owner.value=p.owner||'';f.email.value=p.email||'';f.due.value=p.due||'';f.priority.value=p.priority||'Medium';f.notes.value=p.notes||'';}
  d.showModal();setTimeout(()=>f.name.focus(),50);
}
function openTaskDialog(projectId){const d=$('#taskDialog'),f=$('#newTaskForm');f.reset();f.projectId.value=projectId;d.showModal();setTimeout(()=>f.title.focus(),50);}
function closeDialog(d){if(d?.open)d.close();}
function closeDrawer(){
  if(currentTaskRef){const {pid,tid}=currentTaskRef;const p=workspace().projects.find(p=>p.id===pid);const t=p?.tasks.find(t=>t.id===tid);if(t)renderSubtasks(t,true);}
  $('#taskDrawer').classList.remove('open');$('#taskDrawer').setAttribute('aria-hidden','true');$('#drawerBackdrop').classList.add('hidden');currentTaskRef=null;
}
function renderSubtasks(t,discardUnsaved=false){
  if(discardUnsaved)return;
  const list=$('#subtaskList');
  list.innerHTML=(t.subs||[]).map(s=>`<div class="subtask-row" data-subtask-id="${s.id}"><input type="checkbox" ${s.done?'checked':''}><input type="text" value="${esc(s.title)}" aria-label="Subtask"><button type="button" class="subtask-delete" aria-label="Delete subtask">×</button></div>`).join('')||`<div class="helper-text" style="padding:6px 0 10px">No subtasks yet.</div>`;
  $('#subtaskProgressText').textContent=t.subs?.length?`${t.subs.filter(s=>s.done).length}/${t.subs.length} complete`:'Optional checklist';
}
function readSubtasksFromDrawer(){return $$('#subtaskList .subtask-row').map(row=>({id:row.dataset.subtaskId||uid('s'),title:row.querySelector('input[type=text]').value.trim()||'Subtask',done:row.querySelector('input[type=checkbox]').checked}));}

$('#projectForm').addEventListener('submit',e=>{
  e.preventDefault();const f=e.currentTarget;const id=f.projectId.value;const data={name:f.name.value.trim(),owner:f.owner.value.trim(),email:f.email.value.trim(),due:f.due.value,priority:f.priority.value,notes:f.notes.value.trim()};
  if(id){Object.assign(workspace().projects.find(p=>p.id===id),data);toast('Project updated');}else{workspace().projects.push({id:uid('p'),...data,collapsed:false,tasks:[]});toast('Project created');}
  save();closeDialog($('#projectDialog'));render();
});
$('#newTaskForm').addEventListener('submit',e=>{
  e.preventDefault();const f=e.currentTarget;const p=workspace().projects.find(p=>p.id===f.projectId.value);if(!p)return;
  p.tasks.push({id:uid('t'),title:f.title.value.trim(),status:f.status.value,due:f.due.value,owner:f.owner.value.trim(),email:f.email.value.trim(),notes:'',subs:[]});save();closeDialog($('#taskDialog'));render();toast('Task added');
});
$('#taskForm').addEventListener('submit',e=>{
  e.preventDefault();if(!currentTaskRef)return;const f=e.currentTarget;const p=workspace().projects.find(p=>p.id===currentTaskRef.pid);const t=p?.tasks.find(t=>t.id===currentTaskRef.tid);if(!t)return;
  Object.assign(t,{title:f.title.value.trim(),status:f.status.value,due:f.due.value,owner:f.owner.value.trim(),email:f.email.value.trim(),notes:f.notes.value.trim(),subs:readSubtasksFromDrawer()});save();closeDrawer();render();toast('Task saved');
});
$('#addSubtaskButton').onclick=()=>{const holder=$('#subtaskList');if(holder.querySelector('.helper-text'))holder.innerHTML='';const row=document.createElement('div');row.className='subtask-row';row.dataset.subtaskId=uid('s');row.innerHTML=`<input type="checkbox"><input type="text" placeholder="Subtask" aria-label="Subtask"><button type="button" class="subtask-delete" aria-label="Delete subtask">×</button>`;holder.appendChild(row);row.querySelector('input[type=text]').focus();updateSubtaskText();};
$('#subtaskList').addEventListener('click',e=>{if(e.target.closest('.subtask-delete')){e.target.closest('.subtask-row').remove();updateSubtaskText();}});
$('#subtaskList').addEventListener('change',updateSubtaskText);
function updateSubtaskText(){const rows=$$('#subtaskList .subtask-row');const done=rows.filter(r=>r.querySelector('input[type=checkbox]').checked).length;$('#subtaskProgressText').textContent=rows.length?`${done}/${rows.length} complete`:'Optional checklist';}
$('#deleteTaskButton').onclick=()=>{if(!currentTaskRef)return;if(!confirm('Delete this task?'))return;const p=workspace().projects.find(p=>p.id===currentTaskRef.pid);p.tasks=p.tasks.filter(t=>t.id!==currentTaskRef.tid);save();closeDrawer();render();toast('Task deleted');};
$('#cancelTaskButton').onclick=closeDrawer;$('#closeDrawer').onclick=closeDrawer;$('#drawerBackdrop').onclick=closeDrawer;

$('#newProjectButton').onclick=()=>openProjectDialog();
$('#workspaceButton').onclick=()=>$('#workspaceMenu').showModal();
$('#newWorkspaceButton').onclick=()=>$('#workspaceDialog').showModal();
$('#workspaceForm').addEventListener('submit',e=>{e.preventDefault();const name=e.currentTarget.name.value.trim();if(!name)return;const id=uid('w');state.workspaces.push({id,name,projects:[]});state.selectedWorkspaceId=id;save();e.currentTarget.reset();closeDialog($('#workspaceDialog'));render();toast('Workspace created');});

$$('.close-modal,.cancel-modal').forEach(btn=>btn.addEventListener('click',()=>closeDialog(btn.closest('dialog'))));
$$('dialog.modal').forEach(d=>{
  d.addEventListener('click',e=>{if(e.target===d)closeDialog(d);});
  d.addEventListener('cancel',()=>{});
});

$('#searchToggle').onclick=()=>{const bar=$('#searchBar');bar.classList.toggle('hidden');if(!bar.classList.contains('hidden'))$('#searchInput').focus();};
$('#searchInput').addEventListener('input',e=>{searchTerm=e.target.value.trim().toLowerCase();renderBoard();});
$('#statusFilter').addEventListener('change',e=>{statusFilter=e.target.value;renderBoard();});
$('#clearSearch').onclick=()=>{$('#searchInput').value='';$('#statusFilter').value='all';searchTerm='';statusFilter='all';renderBoard();};
$('#collapseAllButton').onclick=()=>{workspace().projects.forEach(p=>p.collapsed=true);save();renderBoard();};
$('#expandAllButton').onclick=()=>{workspace().projects.forEach(p=>p.collapsed=false);save();renderBoard();};
$('#myEmailInput').addEventListener('input',renderMyWork);

$$('.nav-item').forEach(btn=>btn.onclick=()=>setView(btn.dataset.view));
function setView(view){currentView=view;$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$$('.view-panel').forEach(p=>p.classList.remove('active-view'));$(`#${view}View`).classList.add('active-view');
  const titles={board:['Project Board','Keep every improvement project, task, owner, note and due date in one place.'],overview:['Overview','See project progress and deadlines at a glance.'],mywork:['My Work','Focus on open tasks without digging through every project.']};$('#pageTitle').textContent=titles[view][0];$('#pageSubtitle').textContent=titles[view][1];}

$('#exportButton').onclick=()=>$('#exportDialog').showModal();
$('#exportJsonButton').onclick=()=>{download(`asteria-ci-backup-${today()}.json`,JSON.stringify(state,null,2),'application/json');toast('JSON backup downloaded');};
$('#exportCsvButton').onclick=()=>{
  const rows=[['Workspace','Project','Project Owner','Project Email','Project Due','Priority','Project Notes','Task','Task Status','Task Owner','Task Email','Task Due','Task Notes','Subtasks','Subtasks Complete']];
  state.workspaces.forEach(w=>w.projects.forEach(p=>p.tasks.length?p.tasks.forEach(t=>rows.push([w.name,p.name,p.owner,p.email,p.due,p.priority,p.notes,t.title,statusLabel(t.status),t.owner,t.email,t.due,t.notes,(t.subs||[]).map(s=>s.title).join(' | '),(t.subs||[]).filter(s=>s.done).length+'/'+(t.subs||[]).length])):rows.push([w.name,p.name,p.owner,p.email,p.due,p.priority,p.notes,'','','','','','','',''])));
  const csv=rows.map(r=>r.map(csvCell).join(',')).join('\r\n');download(`asteria-ci-sharepoint-${today()}.csv`,csv,'text/csv;charset=utf-8');toast('SharePoint-ready CSV downloaded');
};
function csvCell(v){const s=String(v??'');return `"${s.replace(/"/g,'""')}"`;}
function download(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function today(){return new Date().toISOString().slice(0,10);}

$('#resetDemoButton').onclick=()=>{if(!confirm('Reset this prototype to the original demo data? This removes local changes on this browser.'))return;state=cloneSeed();save();render();toast('Demo data reset');};
let toastTimer;function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1800);}

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#taskDrawer').classList.contains('open'))closeDrawer();});
render();
