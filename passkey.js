// Supabase Auth: autenticación WebAuthn real, independiente de los datos locales.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.0';
const cfg = window.MIS_HORAS_SUPABASE;
const supabase = createClient(cfg.url, cfg.publishableKey, {auth:{experimental:{passkey:true}}});
const $ = id => document.getElementById(id);
const status = msg => { $('authStatus').textContent=msg; };
const message = err => err?.message || String(err);
async function refresh(){
  try {const {data:{user}}=await supabase.auth.getUser();
    status(user ? 'Sesión iniciada: '+(user.email||'cuenta con passkey')+'. Puedes registrar una passkey.' : 'Sin sesión. Confirma primero el enlace enviado a tu correo o entra con passkey.');
  } catch(e){status('No se pudo consultar la sesión: '+message(e));}
}
$('authEmailBtn').onclick=async()=>{
 const email=$('authEmail').value.trim();if(!email){status('Escribe tu correo.');return;}
 status('Enviando enlace…');
 try{const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;status('Revisa tu correo y abre el enlace desde el iPhone. Luego vuelve a Ajustes y registra tu passkey.');}catch(e){status('Error: '+message(e));}
};
$('authEnroll').onclick=async()=>{
 status('Comprobando cuenta…');
 try{const {data:{user},error:ue}=await supabase.auth.getUser();if(ue||!user)throw Error('Primero entra desde el enlace de tu correo.');
 status('Confirma la creación de la passkey en el iPhone…');
 const {data,error}=await supabase.auth.registerPasskey();if(error)throw error;localStorage.setItem('mis-horas-passkey-enabled','1');status('✓ Passkey registrada correctamente. ID: '+data.id.slice(0,8)+'…');
 }catch(e){status('No se pudo registrar: '+message(e));}
};
$('authPasskey').onclick=async()=>{
 status('Solicitando autenticación del iPhone…');
 try{await supabase.auth.signOut();const {data,error}=await supabase.auth.signInWithPasskey();if(error)throw error;status('✓ Autenticación real con passkey correcta: '+(data.user?.email||'usuario verificado'));}
 catch(e){status('No se pudo autenticar: '+message(e));}
};
window.misHorasPasskeyAuth=async()=>{
  if(!window.PublicKeyCredential)throw Error('Este navegador no admite passkeys.');
  // Fresh challenge and ceremony on every unlock, not merely an existing session.
  const {data,error}=await supabase.auth.signInWithPasskey();
  if(error)throw error;
  if(!data?.user)throw Error('No se pudo verificar tu identidad.');
  return true;
};
refresh();
