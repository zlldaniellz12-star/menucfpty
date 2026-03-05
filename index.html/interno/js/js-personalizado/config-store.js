const LSKEY = "cakefit_config_v1";

function loadConfig(){
  const saved = localStorage.getItem(LSKEY);
  if(saved){
    try{
      return JSON.parse(saved);
    }catch(e){
      console.warn("Config corrupta, usando default");
    }
  }
  return window.CAKEFIT_DEFAULT || {};
}

window.CAKEFIT_CONFIG = loadConfig();
