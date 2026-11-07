/* ==========================================================================
   DEFIB INTERACTIVE CORE ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- DOM Elements ---
    const btnRunRescue = document.getElementById('btn-run-rescue');
    const btnResetDemo = document.getElementById('btn-reset-demo');
    const terminalLogs = document.getElementById('agent-terminal-logs');
    
    // Live Proposal Card elements
    const propCard = document.getElementById('proposal-card-42');
    const statusIndicator = document.getElementById('prop-status-indicator');
    const participationValue = document.getElementById('current-participation-value');
    const progressBarFill = document.getElementById('participation-progress-bar');
    const timeRemainingValue = document.getElementById('time-remaining-value');
    const bountyStatusValue = document.getElementById('bounty-status-value');
    const auditStatusValue = document.getElementById('audit-status-value');
    
    // Receipt Panel
    const receiptSection = document.getElementById('receipt-card-section');
    const receiptTimestamp = document.getElementById('receipt-timestamp');
    const receiptHash = document.getElementById('receipt-hash');
    
    // Architecture Nodes & Arrows
    const nodeDao = document.getElementById('arch-node-dao');
    const nodeCore = document.getElementById('arch-node-core');
    const nodeVault = document.getElementById('arch-node-vault');
    const nodeToken = document.getElementById('arch-node-token');
    
    const flow1 = document.getElementById('flow-arrow-1');
    const flow2 = document.getElementById('flow-arrow-2');
    const flow3 = document.getElementById('flow-arrow-3');

    // --- State variables ---
    let isRunning = false;
    let stepTimeoutIds = [];

    // --- Utility: Append log line with color class ---
    const addLog = (text, type = 'muted') => {
        const line = document.createElement('div');
        line.className = `log-line text-${type}`;
        line.innerHTML = `&gt; ${text}`;
        terminalLogs.appendChild(line);
        terminalLogs.scrollTop = terminalLogs.scrollHeight; // Auto scroll to bottom
    };

    // --- Utility: Set a delay helper to support sequential queue ---
    const queueStep = (delay, action) => {
        const timeoutId = setTimeout(action, delay);
        stepTimeoutIds.push(timeoutId);
    };

    // --- Simulation Execution Flow ---
    const startRescueSimulation = () => {
        if (isRunning) return;
        isRunning = true;

        // 1. UI Initial lock
        btnRunRescue.disabled = true;
        btnRunRescue.querySelector('.btn-text').textContent = 'Rescue Active...';
        
        // Clear default stand-by lines
        terminalLogs.innerHTML = '';
        
        // 2. Evaluation Step (0ms)
        addLog('System evaluation loop triggered.', 'cyan');
        addLog('Connecting to MockDAO.sol... Connection established.', 'muted');
        
        queueStep(1000, () => {
            addLog('Evaluating Proposal #42 risk conditions on-chain...', 'cyan');
            nodeDao.classList.add('active');
        });

        // 3. Telemetry Check (2200ms)
        queueStep(2200, () => {
            addLog('Telemetry: Required Quorum = 20.0%, Current Participation = 16.0%', 'muted');
            addLog('Telemetry: Time Remaining = 3600s (60 minutes). Limit: 3600s', 'muted');
            flow1.classList.add('active');
            nodeCore.classList.add('active');
        });

        // 4. Critical Risk Assessment (3500ms)
        queueStep(3500, () => {
            addLog('🚨 CRITICAL QUORUM RISK DETECTED!', 'red');
            addLog('- Quorum gap: 4.0% points remaining.', 'red');
            addLog('- Deadline condition satisfied (60 mins <= 60 mins limit).', 'red');
            addLog('- Participation (16.0%) falls below 90% quorum threshold (18.0%).', 'red');
        });

        // 5. Decision & Incentive Launch (5000ms)
        queueStep(5000, () => {
            addLog('🤖 AUTONOMOUS KEEPER DECISION MAKER:', 'cyan');
            addLog('Action: Activate Targeted Voting Incentive.', 'yellow');
            addLog('Funding BountyVault.sol... Depositing 100 DFIB tokens.', 'yellow');
            
            flow2.classList.add('active');
            nodeVault.classList.add('active');
        });

        // 6. Deposit State Update (6500ms)
        queueStep(6500, () => {
            addLog('✔ BountyVault deposits complete.', 'green');
            bountyStatusValue.textContent = '100 DFIB ACTIVE';
            bountyStatusValue.className = 'tel-value badge-active';
            
            // Connect utility token node
            flow3.classList.add('active');
            nodeToken.classList.add('active');
        });

        // 7. On-chain Proof of Reasoning receipt (7800ms)
        queueStep(7800, () => {
            addLog('Writing Proof of Reasoning receipt log to blockchain...', 'cyan');
        });

        // 8. Receipt Log Committed (9200ms)
        queueStep(9200, () => {
            const randomHash = '0xdefib42' + Array.from({length: 56}, () => Math.floor(Math.random()*16).toString(16)).join('');
            const currentTimestamp = new Date().toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
            
            receiptHash.textContent = randomHash;
            receiptTimestamp.textContent = currentTimestamp;
            
            addLog(`✔ ProofOfReasoning Event Emitted!`, 'green');
            addLog(`Tx Hash: 0x998ad30ecf575e855a2745c857e5fed2a31f46960727ec97ef0b6...`, 'muted');
            addLog(`Reasoning Hash: ${randomHash.slice(0, 20)}...`, 'muted');

            auditStatusValue.textContent = 'RECORDED';
            auditStatusValue.className = 'tel-value badge-active';
            
            // Reveal Receipt panel
            receiptSection.classList.remove('hidden');
            receiptSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        // 9. Simulating Voter Reaction (10800ms)
        queueStep(10800, () => {
            addLog('Simulating voter reaction to active 100 DFIB reward...', 'cyan');
        });

        // 10. Voter 1 Casts Vote (12000ms)
        queueStep(12000, () => {
            addLog('🗳️ Voter 1 (0x709979...) cast vote representing +3% participation.', 'yellow');
            addLog('✔ Voter 1 claimed 100 DFIB bounty payout from BountyVault.', 'muted');
            
            // Increment Participation
            animateParticipation(16, 19);
        });

        // 11. Voter 2 Casts Vote (13500ms)
        queueStep(13500, () => {
            addLog('🗳️ Voter 2 (0x3C44Cd...) cast vote representing +2% participation.', 'yellow');
            addLog('✔ Voter 2 claimed 100 DFIB bounty payout from BountyVault.', 'muted');
            
            // Increment Participation to 21%
            animateParticipation(19, 21);
        });

        // 12. Final Quorum Reached Success (15000ms)
        queueStep(15000, () => {
            addLog('Re-evaluating quorum criteria...', 'cyan');
            addLog('Quorum status: 21% participation >= 20% target.', 'green');
            addLog('🎉 SUCCESS: Proposal #42 has achieved quorum and successfully rescued!', 'green');

            // Toggle Card to Success State
            propCard.classList.remove('active-danger');
            propCard.classList.add('active-success');
            
            statusIndicator.textContent = 'QUORUM REACHED';
            statusIndicator.className = 'status-indicator rescued';
            
            timeRemainingValue.textContent = '60 mins';
            timeRemainingValue.className = 'tel-value'; // remove warning-pulse
            
            nodeDao.classList.remove('active');
            nodeDao.classList.add('rescued');
            nodeCore.classList.remove('active');
            nodeCore.classList.add('rescued');
            nodeVault.classList.remove('active');
            nodeVault.classList.add('rescued');
            nodeToken.classList.remove('active');
            nodeToken.classList.add('rescued');

            // Enable Reset
            btnResetDemo.classList.remove('hidden');
            btnRunRescue.querySelector('.btn-text').textContent = 'Proposal Rescued';
            btnRunRescue.disabled = true;
        });
    };

    // --- Counter / Bar Animate Utility ---
    const animateParticipation = (start, end) => {
        let current = start;
        const interval = setInterval(() => {
            if (current >= end) {
                clearInterval(interval);
            } else {
                current++;
                participationValue.textContent = `${current}%`;
                progressBarFill.style.width = `${current}%`;
            }
        }, 150);
    };

    // --- Reset Demo Engine ---
    const resetDemo = () => {
        // Clear all timers to prevent overlaps
        stepTimeoutIds.forEach(id => clearTimeout(id));
        stepTimeoutIds = [];
        isRunning = false;

        // Reset elements in Live Proposal
        propCard.className = 'proposal-card active-danger';
        statusIndicator.textContent = 'CRITICAL RISK';
        statusIndicator.className = 'status-indicator critical';
        
        participationValue.textContent = '16%';
        progressBarFill.style.width = '16%';
        
        timeRemainingValue.textContent = '60 mins';
        timeRemainingValue.className = 'tel-value tel-time warning-pulse';
        
        bountyStatusValue.textContent = 'INACTIVE';
        bountyStatusValue.className = 'tel-value badge-inactive';
        
        auditStatusValue.textContent = 'UNRECORDED';
        auditStatusValue.className = 'tel-value badge-inactive';

        // Hide receipt card & reset button
        receiptSection.classList.add('hidden');
        btnResetDemo.classList.add('hidden');

        // Reset primary action button
        btnRunRescue.disabled = false;
        btnRunRescue.querySelector('.btn-text').textContent = 'Run Defib Rescue';

        // Clear terminal & restore standard lines
        terminalLogs.innerHTML = `
            <div class="log-line text-muted">&gt; System initialized. Awaiting quorum evaluation trigger...</div>
            <div class="log-line text-muted">&gt; Standing by (MockDAO connection stable)...</div>
        `;

        // Reset Architecture Nodes
        [nodeDao, nodeCore, nodeVault, nodeToken].forEach(node => {
            node.className = 'arch-node';
        });
        nodeDao.classList.add('active'); // set initial DAO active state
        
        [flow1, flow2, flow3].forEach(flow => {
            flow.className = 'arch-flow-arrow';
        });

        // Scroll page back to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Action Listeners ---
    btnRunRescue.addEventListener('click', startRescueSimulation);
    btnResetDemo.addEventListener('click', resetDemo);

});
