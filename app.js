import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
const $=id=>document.getElementById(id);
let app,auth,db;
try{
 app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
 window.addEventListener("load",()=>{$("loginMsg").textContent="FIREBASE SDK ONLINE · "+firebaseConfig.projectId});
}catch(e){
 window.addEventListener("load",()=>{$("loginMsg").textContent="ERROR SDK · "+(e.code||"sin-codigo")+" · "+e.message});
 throw e;
}
$("enter").onclick=async()=>{
 const email=$("email").value.trim(), password=$("password").value;
 if(!email||!password){$("loginMsg").textContent="ESCRIBE CORREO Y CONTRASEÑA";return}
 $("enter").disabled=true;$("loginMsg").textContent="FIREBASE ONLINE · AUTENTICANDO...";
 try{
  const timeout=new Promise((_,reject)=>setTimeout(()=>reject(Object.assign(new Error("Firebase Auth no respondió en 12 segundos"),{code:"xe/auth-timeout"})),12000));
  await Promise.race([signInWithEmailAndPassword(auth,email,password),timeout]);
  $("loginMsg").textContent="ACCESO AUTORIZADO";
 }catch(e){
  console.error("XE AUTH ERROR",e);
  $("loginMsg").textContent="ERROR · "+(e.code||"sin-codigo")+" · "+(e.message||"Error desconocido");
 }finally{$("enter").disabled=false}
};
$("logout").onclick=()=>signOut(auth);
let unsub=null;
onAuthStateChanged(auth,user=>{ $("login").hidden=!!user;$("dashboard").hidden=!user;if(unsub){unsub();unsub=null}if(user) load();});
function load(){const q=query(collection(db,"events"),orderBy("createdAt","desc"),limit(1000));unsub=onSnapshot(q,snap=>{
 const a=snap.docs.map(d=>({id:d.id,...d.data()})), today=new Date().toISOString().slice(0,10);
 $("total").textContent=a.filter(x=>x.event==="page_visit").length;
 $("today").textContent=a.filter(x=>x.event==="page_visit"&&dateOf(x.createdAt)===today).length;
 $("tests").textContent=a.filter(x=>x.event==="test_completed").length;
 $("cals").textContent=a.filter(x=>x.event==="calibration_completed").length;
 renderCount("countries",a.map(x=>x.country||"Desconocido"));
 renderCount("models",a.filter(x=>x.model).map(x=>x.model));
 $("events").innerHTML=a.slice(0,50).map(x=>`<div class="event"><span>${escapeHtml(showDate(x.createdAt))}</span><b>${escapeHtml(x.event||"—")}</b><span>${escapeHtml(x.model||"—")} · ${escapeHtml(x.country||"—")}</span></div>`).join("")||"Sin eventos.";
},e=>{$("events").textContent="ERROR FIRESTORE · "+e.code+" · "+e.message});}
function renderCount(id,vals){const m={};vals.forEach(v=>m[v]=(m[v]||0)+1);$(id).innerHTML=Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`<div class="row"><span>${escapeHtml(n)}</span><b>${v}</b></div>`).join("")||"Sin datos todavía."}
function dateOf(t){try{return t?.toDate?t.toDate().toISOString().slice(0,10):""}catch{return""}}
function showDate(t){try{return t?.toDate?t.toDate().toLocaleString("es-MX"):"—"}catch{return"—"}}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
