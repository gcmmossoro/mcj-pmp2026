/**
 * MCJ Seguro para Elas
 * Script de geolocalização + envio via WhatsApp
 * GCM Mossoró-RN
 */

const GCM_NUMERO = '5584999700760';

function montarMensagemSemLocalizacao() {
  var texto =
    '*** PRECISO DE AJUDA - EMERGENCIA ***\n' +
    'Estou em situação de risco. Por favor, me ajude.\n' +
    '(Localização não disponível)';
  return encodeURIComponent(texto);
}

function montarMensagemComLocalizacao(lat, lon) {
  var linkMapa = 'https://maps.google.com/?q=' + lat + ',' + lon;
  var texto =
    '*** PRECISO DE AJUDA - EMERGENCIA ***\n' +
    'Estou em situação de risco. Minha localização:\n' +
    linkMapa + '\n' +
    'Coordenadas: ' + lat.toFixed(6) + ', ' + lon.toFixed(6);
  return encodeURIComponent(texto);
}

function abrirWhatsApp(mensagem) {
  var url = 'https://wa.me/' + GCM_NUMERO + '?text=' + mensagem;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function mostrarStatus(texto, tipo) {
  const el = document.getElementById('status-localizacao');
  if (!el) return;
  el.textContent = texto;
  el.className = 'status-msg status-' + tipo;
  el.style.display = 'block';
}

function ocultarStatus() {
  const el = document.getElementById('status-localizacao');
  if (el) el.style.display = 'none';
}

function setBotaoCarregando(carregando) {
  const btn = document.getElementById('btn-whatsapp');
  if (!btn) return;
  if (carregando) {
    btn.classList.add('carregando');
    btn.setAttribute('aria-busy', 'true');
    btn.querySelector('.btn-texto').textContent = 'Obtendo localização…';
  } else {
    btn.classList.remove('carregando');
    btn.removeAttribute('aria-busy');
    btn.querySelector('.btn-texto').textContent = 'Disk Denúncia GCM — WhatsApp';
  }
}

function enviarComLocalizacao() {
  if (!navigator.geolocation) {
    mostrarStatus('Geolocalização não suportada neste dispositivo.', 'aviso');
    abrirWhatsApp(montarMensagemSemLocalizacao());
    return;
  }

  setBotaoCarregando(true);
  mostrarStatus('📍 Obtendo sua localização…', 'info');

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      setBotaoCarregando(false);
      ocultarStatus();
      const { latitude, longitude } = pos.coords;
      abrirWhatsApp(montarMensagemComLocalizacao(latitude, longitude));
    },
    function (erro) {
      setBotaoCarregando(false);
      let msg = '';
      switch (erro.code) {
        case erro.PERMISSION_DENIED:
          msg = 'Permissão de localização negada. Abrindo WhatsApp sem localização.';
          break;
        case erro.POSITION_UNAVAILABLE:
          msg = 'Localização indisponível. Abrindo WhatsApp sem localização.';
          break;
        default:
          msg = 'Não foi possível obter localização. Abrindo WhatsApp.';
      }
      mostrarStatus(msg, 'aviso');
      setTimeout(ocultarStatus, 4000);
      abrirWhatsApp(montarMensagemSemLocalizacao());
    },
    { timeout: 8000, maximumAge: 0, enableHighAccuracy: true }
  );
}

document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('btn-whatsapp');
  const btnFloat = document.getElementById('btn-whatsapp-float');

  if (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      enviarComLocalizacao();
    });
  }

  if (btnFloat) {
    btnFloat.addEventListener('click', function (e) {
      e.preventDefault();
      enviarComLocalizacao();
    });
  }
});
