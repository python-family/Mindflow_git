// Mockup data (Pontos basilares)
let events = [
    {
        id: "1",
        date: "2026-09-05",
        category: "Contrato",
        title: "Contrato assinado",
        description: "Contrato de desenvolvimento do Agente SDR assinado pelas partes. Início oficial do projeto.",
        responsible: "João — MindFlow",
        status: "Concluído",
        nextStep: "Emitir cobrança inicial"
    },
    {
        id: "2",
        date: "2026-09-07",
        category: "Pagamento",
        title: "Pagamento confirmado",
        description: "Primeira parcela referente ao setup confirmada pelo setor financeiro.",
        responsible: "Financeiro — MindFlow",
        status: "Concluído",
        nextStep: "Agendar Onboarding com o cliente"
    },
    {
        id: "3",
        date: "2026-09-08",
        category: "Onboarding",
        title: "Onboarding realizado",
        description: "Reunião de kickoff realizada com sucesso. Alinhamento de expectativas, fluxos de comunicação e cronograma.",
        responsible: "João — MindFlow",
        status: "Concluído",
        nextStep: "Aguardar envio dos materiais base pelo cliente"
    },
    {
        id: "4",
        date: "2026-09-18",
        category: "Entrega",
        title: "MVP da IA entregue",
        description: "O primeiro MVP (Produto Mínimo Viável) do agente foi disponibilizado para validação do cliente no ambiente de testes isolado.",
        responsible: "Equipe Tech — MindFlow",
        status: "Concluído",
        nextStep: "Aguardar feedback e bateria de testes do cliente"
    },
    {
        id: "5",
        date: "2026-09-21",
        category: "Alteração",
        title: "Alteração solicitada",
        description: "Cliente solicitou mudança no tom de voz do agente para ser um pouco menos formal e mais acolhedor.",
        responsible: "Cliente",
        status: "Concluído",
        nextStep: "Equipe técnica implementar alterações no prompt"
    },
    {
        id: "6",
        date: "2026-09-22",
        category: "Desenvolvimento",
        title: "Alteração em desenvolvimento",
        description: "Equipe de engenharia ajustando o prompt base e as restrições de resposta do agente SDR.",
        responsible: "Equipe Tech — MindFlow",
        status: "Em andamento",
        nextStep: "Validar internamente e reenviar para aprovação final"
    }
];

let selectedEventId = null;

// DOM Elements
const timelineContainer = document.getElementById('horizontal-timeline');
const addEventBtn = document.getElementById('add-event-btn');
const modal = document.getElementById('event-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const eventForm = document.getElementById('event-form');

// Details section DOM
const detailsEmpty = document.getElementById('details-empty');
const detailsContent = document.getElementById('details-content');

// Icons map for categories
const categoryIcons = {
    "Contrato": "ri-file-text-line",
    "Pagamento": "ri-money-dollar-circle-line",
    "Onboarding": "ri-presentation-line",
    "Informação recebida": "ri-inbox-archive-line",
    "Informação pendente": "ri-time-line",
    "Desenvolvimento": "ri-code-s-slash-line",
    "Entrega": "ri-rocket-line",
    "Feedback": "ri-chat-smile-3-line",
    "Alteração": "ri-edit-circle-line",
    "Reunião": "ri-vidicon-line",
    "Aprovação": "ri-checkbox-circle-line",
    "Problema": "ri-error-warning-line",
    "Outro": "ri-bookmark-line"
};

function formatDateBR(dateString) {
    if(!dateString) return '';
    const parts = dateString.split('-');
    if(parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${day}/${month}`; 
}

function formatDateFullBR(dateString) {
    if(!dateString) return '';
    const parts = dateString.split('-');
    if(parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
}

function getStatusClass(status) {
    const map = {
        "Concluído": "concluido",
        "Em andamento": "em-andamento",
        "Pendente": "pendente",
        "Bloqueado": "bloqueado",
        "Cancelado": "cancelado"
    };
    return map[status] || "pendente";
}

function renderTimeline() {
    timelineContainer.innerHTML = '';
    
    // Sort events by date ascending for horizontal timeline
    let sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedEvents.length === 0) {
        timelineContainer.innerHTML = `<p style="color: var(--text-muted); position:absolute; left:40px; top:40px;">Nenhum evento registrado ainda.</p>`;
        renderDetails();
        return;
    }

    sortedEvents.forEach(ev => {
        const isActive = ev.id === selectedEventId ? 'active' : '';
        const nodeHTML = `
            <div class="timeline-node ${isActive}" onclick="selectEvent('${ev.id}')">
                <div class="node-date">${formatDateBR(ev.date)}</div>
                <div class="node-point"></div>
                <div class="node-title">${ev.title}</div>
            </div>
        `;
        timelineContainer.insertAdjacentHTML('beforeend', nodeHTML);
    });

    renderDetails();
}

function selectEvent(id) {
    selectedEventId = id;
    renderTimeline();
}

window.selectEvent = selectEvent;

function renderDetails() {
    if (!selectedEventId) {
        detailsEmpty.classList.remove('hidden');
        detailsContent.classList.add('hidden');
        return;
    }

    const ev = events.find(x => x.id === selectedEventId);
    if (!ev) {
        detailsEmpty.classList.remove('hidden');
        detailsContent.classList.add('hidden');
        return;
    }

    detailsEmpty.classList.add('hidden');
    detailsContent.classList.remove('hidden');

    const iconClass = categoryIcons[ev.category] || "ri-calendar-event-line";

    const html = `
        <div class="details-header">
            <div class="details-title-area">
                <h3><i class="${iconClass}"></i> ${ev.title}</h3>
                <span class="event-date">${formatDateFullBR(ev.date)} • ${ev.category}</span>
            </div>
            <div class="details-actions">
                <button class="btn secondary" onclick="editEvent('${ev.id}')"><i class="ri-edit-line"></i> Editar</button>
                <button class="btn danger" onclick="deleteEvent('${ev.id}')"><i class="ri-delete-bin-line"></i> Excluir</button>
            </div>
        </div>
        <div class="details-body">
            <div class="details-desc">
                ${ev.description || 'Sem descrição.'}
            </div>
            <div class="details-meta-grid">
                <div class="info-block">
                    <span class="info-label">Status</span>
                    <span class="badge" style="color:var(--primary); font-weight:600; font-size:0.9rem;">${ev.status}</span>
                </div>
                <div class="info-block">
                    <span class="info-label">Responsável</span>
                    <span class="info-value">${ev.responsible}</span>
                </div>
                <div class="info-block">
                    <span class="info-label">Próximo Passo</span>
                    <span class="info-value next-step"><i class="ri-arrow-right-line"></i> ${ev.nextStep || '-'}</span>
                </div>
            </div>
        </div>
    `;

    detailsContent.innerHTML = html;
}

// Modal logic
function openModal(isEdit = false, ev = null) {
    document.getElementById('modal-title').innerText = isEdit ? 'Editar Etapa' : 'Nova Etapa';
    if (!isEdit) {
        eventForm.reset();
        document.getElementById('event-id').value = '';
        document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
    } else {
        document.getElementById('event-id').value = ev.id;
        document.getElementById('event-date').value = ev.date;
        document.getElementById('event-category').value = ev.category;
        document.getElementById('event-title').value = ev.title;
        document.getElementById('event-desc').value = ev.description;
        document.getElementById('event-resp').value = ev.responsible;
        document.getElementById('event-status').value = ev.status;
        document.getElementById('event-next').value = ev.nextStep;
    }
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
}

addEventBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if(e.target === modal) closeModal();
});

eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('event-id').value;
    const evData = {
        id: id || Date.now().toString(),
        date: document.getElementById('event-date').value,
        category: document.getElementById('event-category').value,
        title: document.getElementById('event-title').value,
        description: document.getElementById('event-desc').value,
        responsible: document.getElementById('event-resp').value,
        status: document.getElementById('event-status').value,
        nextStep: document.getElementById('event-next').value
    };

    if (id) {
        const index = events.findIndex(x => x.id === id);
        if (index > -1) events[index] = evData;
    } else {
        events.push(evData);
    }

    selectedEventId = evData.id; 
    closeModal();
    renderTimeline();
});

window.editEvent = function(id) {
    const ev = events.find(x => x.id === id);
    if(ev) openModal(true, ev);
};

window.deleteEvent = function(id) {
    if(confirm('Tem certeza que deseja excluir esta etapa do projeto?')) {
        events = events.filter(x => x.id !== id);
        if(selectedEventId === id) selectedEventId = null;
        renderTimeline();
    }
};

// Select the last event by default
if (events.length > 0) {
    let lastEv = events.reduce((latest, ev) => new Date(ev.date) > new Date(latest.date) ? ev : latest, events[0]);
    selectedEventId = lastEv.id;
}

// Enable horizontal scroll with mouse wheel
const scrollWrapper = document.querySelector('.horizontal-timeline-wrapper');
scrollWrapper.addEventListener('wheel', (evt) => {
    if (evt.deltaY !== 0) {
        evt.preventDefault();
        scrollWrapper.scrollLeft += evt.deltaY;
    }
});

renderTimeline();
