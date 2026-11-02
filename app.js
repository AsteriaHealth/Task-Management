const seed=[
  {
    id:1,
    name:'SOPs',
    owner:'Continuous Improvement Team',
    email:'ci@asteria.com',
    due:'2026-11-30',
    priority:'High',
    notes:'Standardize, review, approve, train, and release priority SOPs. Open this workstream to see exactly which stage is currently in progress.',
    tasks:[
      {name:'Identify SOPs requiring creation or revision',done:true,due:'2026-11-04',subs:['Collect department requests','Prioritize by risk and impact']},
      {name:'Draft SOP content',done:true,due:'2026-11-10',subs:['Assign document owner','Complete first draft']},
      {name:'Technical and stakeholder review',done:false,due:'2026-11-17',subs:['Route draft to reviewers','Resolve comments and redlines']},
      {name:'Final approval',done:false,due:'2026-11-21',subs:['Quality approval','Department owner approval']},
      {name:'Training and acknowledgement',done:false,due:'2026-11-26',subs:['Train affected employees','Capture acknowledgements']},
      {name:'Release and effectiveness check',done:false,due:'2026-11-30',subs:['Publish controlled version','Verify effectiveness after release']}
    ]
  },
  {
    id:2,
    name:'5S Improvements',
    owner:'Taylor Brooks',
    email:'taylor.brooks@asteria.com',
    due:'2026-12-04',
    priority:'Medium',
    notes:'Close recurring 5S findings and establish clear visual ownership for each area.',
    tasks:[
      {name:'Review previous audit findings',done:true,due:'2026-11-05',subs:['Group recurring issues']},
      {name:'Assign area owners',done:true,due:'2026-11-09',subs:['Confirm ownership by area']},
      {name:'Complete corrective actions',done:false,due:'2026-11-20',subs:['Remove red-tag items','Update visual controls']},
      {name:'Verify corrections',done:false,due:'2026-11-27',subs:['Perform floor verification']},
      {name:'Complete follow-up audit',done:false,due:'2026-12-04',subs:['Document before/after score']}
    ]
  },
  {
    id:3,
    name:'Scrap Reduction',
    owner:'Jordan Patel',
    email:'jordan.patel@asteria.com',
    due:'2026-12-18',
    priority:'High',
    notes:'Identify the largest scrap categories, implement countermeasures, and verify measurable improvement.',
    tasks:[
      {name:'Collect baseline scrap data',done:true,due:'2026-11-06',subs:['Pull 90-day history']},
      {name:'Complete Pareto analysis',done:false,due:'2026-11-13',subs:['Validate top loss codes']},
      {name:'Root cause analysis',done:false,due:'2026-11-20',subs:['Complete 5-Why / fishbone as needed']},
      {name:'Implement countermeasures',done:false,due:'2026-12-04',subs:['Assign actions','Track implementation']},
      {name:'Verify sustained result',done:false,due:'2026-12-18',subs:['Compare post-change scrap rate']}
    ]
  }
];

let projects=JSON.parse(localStorage.getItem('asteriaProjects')||'null')||seed;
const $=s=>document.querySelector(s);
const save=()=>localStorage.setItem('asteriaProjects',JSON.stringify(projects));

function pct(p){return p.tasks.length?Math.round(p.tasks.filter(t=>t.done).length/p.tasks.length*100):0}
function isOver(p){return pct(p)<100&&new Date(p.due+'T23:59:59')<new Date()}
function dueSoon(p){let d=(new Date(p.due)-new Date())/86400000;return pct(p)<100&&d>=0&&d<=7}
function currentStepIndex(p){const i=p.tasks.findIndex(t=>!t.done);return i===-1?Math.max(p.tasks.length-1,0):i}
function currentStep(p){if(!p.tasks.length)return 'No steps added yet';if(pct(p)===100)return 'Complete';return p.tasks[currentStepIndex(p)].name}

function render(){
  let q=$('#search').value.toLowerCase(),f=$('#filter').value;
  let shown=projects.filter(p=>{
    let text=[p.name,p.owner,p.email,...p.tasks.flatMap(t=>[t.name,...(t.subs||[])])].join(' ').toLowerCase();
    let ok=!q||text.includes(q);
    if(f==='active')ok&=pct(p)<100;
    if(f==='complete')ok&=pct(p)===100;
    if(f==='overdue')ok&=isOver(p);
    return ok;
  });
  $('#projects').innerHTML=shown.length?shown.map(card).join(''):`<div class='empty'>No workstreams match this view.</div>`;
  $('#activeCount').textContent=projects.filter(p=>pct(p)<100).length;
  $('#dueCount').textContent=projects.filter(dueSoon).length;
  $('#overdueCount').textContent=projects.filter(isOver).length;
  $('#progressCount').textContent=(projects.length?Math.round(projects.reduce((a,p)=>a+pct(p),0)/projects.length):0)+'%';
}

function card(p){
  let progress=pct(p),over=isOver(p),current=currentStep(p);
  return `<article class='project' data-id='${p.id}'>
    <div class='projectTop' onclick='toggleProject(${p.id})'>
      <div>
        <div class='titleLine'><h3>${esc(p.name)}</h3><span class='pill ${p.priority}'>${p.priority}</span></div>
        <div class='currentStep'><span>Current step</span><b>${esc(current)}</b></div>
        <div class='progress'><i style='width:${progress}%'></i></div>
      </div>
      <div class='hideMobile'><span class='label'>Progress</span><b class='percent'>${progress}%</b></div>
      <div class='hideMobile mobile2'><span class='label'>Due</span><span class='due ${over?'overdue':''}'>${fmt(p.due)}</span></div>
      <div class='hideMobile mobile2'><span class='label'>Steps</span><b>${p.tasks.filter(t=>t.done).length}/${p.tasks.length}</b></div>
      <span class='chev'>›</span>
    </div>
    <div class='details'><div class='detailsInner'><div class='detailPad'>
      <div class='workstreamMeta'><div><span class='label'>Owner</span><b>${esc(p.owner)}</b><small>${esc(p.email)}</small></div><div><span class='label'>Target completion</span><b>${fmtLong(p.due)}</b></div></div>
      <div class='notes'>${esc(p.notes||'No workstream notes yet.')}</div>
      <div class='stepHeader'><div><small>WORKSTREAM STEPS</small><h4>${progress===100?'All steps complete':'Currently on step '+(currentStepIndex(p)+1)+' of '+p.tasks.length}</h4></div><strong>${progress}% complete</strong></div>
      <div class='timeline'>${p.tasks.map((t,i)=>task(p,t,i)).join('')}</div>
      <button class='addTask' onclick='event.stopPropagation();addTask(${p.id})'>＋ Add step</button>
    </div></div></div>
  </article>`;
}

function task(p,t,i){
  const current=!t.done && i===currentStepIndex(p);
  const state=t.done?'complete':current?'current':'upcoming';
  return `<div class='task ${state}'>
    <div class='stepMarker'>${t.done?'✓':i+1}</div>
    <div class='taskBody'>
      <div class='taskTitleRow'>
        <label class='taskCheck'><input type='checkbox' ${t.done?'checked':''} onchange='checkTask(${p.id},${i},this.checked)'><span class='taskName'>${esc(t.name)}</span></label>
        <span class='statusTag ${state}'>${t.done?'Complete':current?'Current step':'Upcoming'}</span>
      </div>
      <div class='taskMeta'>Due ${fmtLong(t.due)} · ${(t.subs?.length||0)} subtask${(t.subs?.length||0)===1?'':'s'}</div>
      ${(t.subs||[]).length?`<div class='subtaskList'>${t.subs.map(s=>`<div class='subtask'><span>↳</span>${esc(s)}</div>`).join('')}</div>`:''}
    </div>
  </div>`;
}

window.toggleProject=id=>document.querySelector(`.project[data-id="${id}"]`).classList.toggle('open');
window.checkTask=(id,i,v)=>{projects.find(p=>p.id===id).tasks[i].done=v;save();render();setTimeout(()=>document.querySelector(`.project[data-id="${id}"]`)?.classList.add('open'),0)};
window.addTask=id=>{
  let p=projects.find(p=>p.id===id);
  let name=prompt('Step title:');if(!name)return;
  let due=prompt('Due date (YYYY-MM-DD):',p.due)||p.due;
  p.tasks.push({name,done:false,due,subs:[]});save();render();setTimeout(()=>document.querySelector(`.project[data-id="${id}"]`)?.classList.add('open'),0)
};

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function fmt(d){return new Date(d+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}
function fmtLong(d){return new Date(d+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}

$('#search').addEventListener('input',render);
$('#filter').addEventListener('change',render);
$('#newProject').onclick=()=>$('#projectDialog').showModal();
$('#projectForm').addEventListener('submit',e=>{
  e.preventDefault();let fd=new FormData(e.target);
  projects.unshift({id:Date.now(),name:fd.get('name'),owner:fd.get('owner'),email:fd.get('email'),due:fd.get('due'),priority:fd.get('priority'),notes:fd.get('notes'),tasks:[]});
  save();e.target.reset();$('#projectDialog').close();render();
});
render();
