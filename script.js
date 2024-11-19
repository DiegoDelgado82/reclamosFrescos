let productos = [];
let reclamos = [];

$(document).ready(() => {
  // Cargar productos del archivo JSON
  fetch('productos.json')
    .then(response => response.json())
    .then(data => {
      productos = data;
      inicializarAutocompletado();
    });

  // Cargar reclamos guardados en localStorage
  const reclamosGuardados = JSON.parse(localStorage.getItem('reclamos')) || [];
  reclamos = reclamosGuardados;
  renderizarTabla();
});

function inicializarAutocompletado() {
  $('#producto').autocomplete({
    source: productos.map(p => p.nombre), // Lista de productos para autocompletado
    minLength: 1
  });
}

function agregarReclamo() {
  const nombre = $('#producto').val();
  const cantidad = parseFloat($('#cantidad').val());

  if (!nombre || cantidad <= 0) {
    Swal.fire('Error', 'Debe seleccionar un producto y una cantidad válida.', 'error');
    return;
  }

  const producto = productos.find(p => p.nombre === nombre);
  if (!producto) {
    Swal.fire('Error', 'Producto no encontrado.', 'error');
    return;
  }

  const existente = reclamos.find(r => r.ean === producto.ean);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    reclamos.push({ ean: producto.ean, nombre: producto.nombre, cantidad });
  }

  localStorage.setItem('reclamos', JSON.stringify(reclamos));
  renderizarTabla();
  $('#producto').val('');
  $('#cantidad').val('');
}

function renderizarTabla() {
  const tbody = $('#tablaReclamos tbody');
  tbody.empty();
  reclamos.forEach((reclamo, index) => {
    tbody.append(`
      <tr>
        <td>${reclamo.ean}</td>
        <td>${reclamo.nombre}</td>
        <td>${reclamo.cantidad.toFixed(2)}</td>
        <td>
          <button class="btn btn-info btn-sm" onclick="usarCalculadora(${index})">
            <i class="fas fa-calculator"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarReclamo(${index})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `);
  });
}

function editarReclamo(index) {
  Swal.fire({
    title: 'Editar Reclamo',
    input: 'number',
    inputLabel: 'Cantidad',
    inputValue: reclamos[index].cantidad,
    showCancelButton: true
  }).then(result => {
    if (result.isConfirmed) {
      reclamos[index].cantidad = parseFloat(result.value);
      localStorage.setItem('reclamos', JSON.stringify(reclamos));
      renderizarTabla();
    }
  });
}

function usarCalculadora(index) {
  Swal.fire({
    title: 'Calculadora',
    html: `
      <input type="number" id="calcValor" class="form-control" placeholder="Cantidad a sumar/restar">
    `,
    showCancelButton: true,
    confirmButtonText: 'Aplicar',
  }).then(result => {
    if (result.isConfirmed) {
      const valor = parseFloat($('#calcValor').val());
      reclamos[index].cantidad += valor;
      localStorage.setItem('reclamos', JSON.stringify(reclamos));
      renderizarTabla();
    }
  });
}

function eliminarReclamo(index) {
  reclamos.splice(index, 1);
  localStorage.setItem('reclamos', JSON.stringify(reclamos));
  renderizarTabla();
}

// Exportar la tabla como imagen
function exportarComoImagen() {
  const tabla = document.getElementById('tablaReclamos');
  html2canvas(tabla).then(canvas => {
    const link = document.createElement('a');
    link.download = 'reclamos.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(error => {
    console.error('Error al generar la imagen:', error);
    Swal.fire('Error', 'No se pudo exportar la tabla como imagen.', 'error');
  });
}

// Exportar la tabla como Excel
function exportarComoExcel() {
  const table = document.getElementById('tablaReclamos');
  const rows = Array.from(table.querySelectorAll('tr'));

  // Extraer datos de la tabla
  const data = rows.map(row => Array.from(row.querySelectorAll('td, th')).map(cell => cell.innerText));

  // Crear hoja de Excel con SheetJS
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reclamos');

  // Descargar archivo Excel
  XLSX.writeFile(wb, 'reclamos.xlsx');
}

// Exportar la tabla como PDF
function exportarComoPDF() {
  const tabla = document.getElementById('tablaReclamos');

  html2canvas(tabla).then(canvas => {
    const imgData = canvas.toDataURL('image/png');

    // Crear un PDF con jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190; // Ancho de la imagen en el PDF (ajustado para A4)
    const pageHeight = pdf.internal.pageSize.height;
    const imgHeight = canvas.height * imgWidth / canvas.width; // Mantener la proporción

    let position = 10; // Margen superior
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);

    pdf.save('reclamos.pdf');
  }).catch(error => {
    console.error('Error al generar el PDF:', error);
    Swal.fire('Error', 'No se pudo exportar la tabla como PDF.', 'error');
  });
}

function cargarLogo() {
  $('#logoInput').click();
}

function mostrarLogo(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    $('#logo').attr('src', e.target.result);
  };
  reader.readAsDataURL(file);
}
