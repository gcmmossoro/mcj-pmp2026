/**
 * MCJ Seguro para Elas
 * Modal de triagem (Opção B) + geolocalização só para emergência imediata
 * GCM Mossoró-RN
 */

var GCM_NUMERO = '5584986317000';

var CABECALHOS = {
  emergencia: '*** PRECISO DE AJUDA - EMERGÊNCIA ***',
  denuncia: 'Olá, gostaria de registrar uma denúncia.',
  testemunha: 'Olá, presenciei uma situação de violência e gostaria de denunciar.',
  informacao: 'Olá, gostaria de obter informações sobre a Lei Maria da Penha.',
};

var FONTE = '\n[Fonte: Site MCJ Seguro para Elas - GCM/PMP Mossoró]';

var OPCOES = [
  { valor: 'Estou em perigo agora', label: 'Estou em perigo agora', icone: '🆘', geolocalizacao: true, cabecalho: CABECALHOS.emergencia },
  { valor: 'Quero denunciar violencia que sofri', label: 'Quero denunciar violência sofrida', icone: '📢', geolocalizacao: false, cabecalho: CABECALHOS.denuncia },
  { valor: 'Quero denunciar violencia contra outra pessoa', label: 'Vi violência contra outra pessoa', icone: '👁', geolocalizacao: false, cabecalho: CABECALHOS.testemunha },
  { valor: 'Preciso de informacoes sobre a Lei Maria da Penha', label: 'Preciso de informações legais', icone: '⚖️', geolocalizacao: false, cabecalho: CABECALHOS.informacao },
];

/* ── Mensagens ── */

function montarMensagemSemLocalizacao(cabecalho) {
  return encodeURIComponent(cabecalho + FONTE);
}

function montarMensagemComLocalizacao(cabecalho, lat, lon) {
  var link = 'https://maps.google.com/?q=' + lat + ',' + lon;
  return encodeURIComponent(
    cabecalho + '\n' +
    'Localização: ' + link + '\n' +
    'Coordenadas: ' + lat.toFixed(6) + ', ' + lon.toFixed(6) +
    FONTE
  );
}

function abrirWhatsApp(mensagem) {
  window.location.href = 'https://wa.me/' + GCM_NUMERO + '?text=' + mensagem;
}

/* ── Status ── */
function mostrarStatus(texto, tipo) {
  var el = document.getElementById('status-localizacao');
  if (!el) return;
  el.textContent = texto;
  el.className = 'status-msg status-' + tipo;
  el.style.display = 'block';
}

function ocultarStatus() {
  var el = document.getElementById('status-localizacao');
  if (el) el.style.display = 'none';
}

function setBotaoCarregando(sim) {
  var btn = document.getElementById('btn-whatsapp');
  if (!btn) return;
  if (sim) {
    btn.classList.add('carregando');
    btn.setAttribute('aria-busy', 'true');
    btn.querySelector('.btn-texto').textContent = 'Obtendo localização...';
  } else {
    btn.classList.remove('carregando');
    btn.removeAttribute('aria-busy');
    btn.querySelector('.btn-texto').textContent = 'Disk Denuncia GCM - WhatsApp';
  }
}

/* ── Envio ── */
function enviarComGeo(cabecalho) {
  if (!navigator.geolocation) {
    abrirWhatsApp(montarMensagemSemLocalizacao(cabecalho));
    return;
  }
  setBotaoCarregando(true);
  mostrarStatus('Obtendo sua localização...', 'info');

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      setBotaoCarregando(false);
      ocultarStatus();
      abrirWhatsApp(montarMensagemComLocalizacao(cabecalho, pos.coords.latitude, pos.coords.longitude));
    },
    function () {
      setBotaoCarregando(false);
      ocultarStatus();
      abrirWhatsApp(montarMensagemSemLocalizacao(cabecalho));
    },
    { timeout: 8000, maximumAge: 0, enableHighAccuracy: true }
  );
}

function enviarSemGeo(cabecalho) {
  abrirWhatsApp(montarMensagemSemLocalizacao(cabecalho));
}

/* ── Modal de triagem ── */
function abrirModal() {
  if (document.getElementById('modal-overlay')) return;

  var overlay = document.createElement('div');
  overlay.id = 'modal-overlay';

  var opcoesHTML = OPCOES.map(function (op, i) {
    return (
      '<label class="triagem-opcao" for="op-' + i + '">' +
      '<input type="radio" name="motivo" id="op-' + i + '" value="' + i + '" />' +
      '<span class="triagem-icone">' + op.icone + '</span>' +
      '<span class="triagem-label">' + op.label + '</span>' +
      '</label>'
    );
  }).join('');

  overlay.innerHTML =
    '<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">' +
    '<h2 class="modal-titulo" id="modal-titulo">Como podemos ajudar?</h2>' +
    '<p class="modal-desc">Selecione o que melhor descreve sua situação:</p>' +
    '<div class="triagem-lista">' + opcoesHTML + '</div>' +
    '<p class="modal-geo-aviso" id="modal-geo-aviso"></p>' +
    '<div class="modal-acoes">' +
    '<button class="modal-btn modal-btn-sim" id="modal-continuar" disabled>Continuar</button>' +
    '<button class="modal-btn modal-btn-nao" id="modal-cancelar">Cancelar</button>' +
    '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  requestAnimationFrame(function () { overlay.classList.add('modal-visivel'); });

  overlay.querySelectorAll('input[name="motivo"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      var idx = parseInt(this.value, 10);
      var aviso = document.getElementById('modal-geo-aviso');
      document.getElementById('modal-continuar').disabled = false;
      if (OPCOES[idx].geolocalizacao) {
        aviso.textContent = 'Sua localização sera enviada automaticamente para a GCM.';
        aviso.style.display = 'block';
      } else {
        aviso.textContent = '';
        aviso.style.display = 'none';
      }
    });
  });

  document.getElementById('modal-continuar').addEventListener('click', function () {
    var selecionado = overlay.querySelector('input[name="motivo"]:checked');
    if (!selecionado) return;
    var idx = parseInt(selecionado.value, 10);
    var opcao = OPCOES[idx];
    fecharModal();
    if (opcao.geolocalizacao) {
      enviarComGeo(opcao.cabecalho);
    } else {
      enviarSemGeo(opcao.cabecalho);
    }
  });

  document.getElementById('modal-cancelar').addEventListener('click', fecharModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) fecharModal();
  });
}

function fecharModal() {
  var overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('modal-visivel');
  setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 280);
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('btn-whatsapp');
  if (btn) btn.addEventListener('click', function (e) { e.preventDefault(); abrirModal(); });

  var btnFloat = document.getElementById('btn-whatsapp-float');
  if (btnFloat) btnFloat.addEventListener('click', function (e) { e.preventDefault(); abrirModal(); });
});
