// roda o mais cedo possivel (script no topo do <head>, antes do CSS)
// pra aplicar o tema salvo ANTES do primeiro paint -- sem isso, a
// pagina piscaria no tema padrao (escuro) por um instante antes de
// trocar pro tema claro salvo, toda vez que a pessoa recarregar.
(function () {
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {
    // localStorage pode falhar (modo privado, restricoes do navegador)
    // -- nesse caso so' fica no tema escuro (padrao), sem quebrar nada.
  }
})();
