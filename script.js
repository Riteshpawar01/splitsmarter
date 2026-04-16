        // State
        let friends = [];
        let expenses = [];
        let balances = {};

        // DOM Elements
        const friendForm = document.getElementById('add-friend-form');
        const friendInput = document.getElementById('friend-name');
        const friendList = document.getElementById('friend-list');
        const friendCount = document.getElementById('friend-count');
        const payersList = document.getElementById('expense-payers-list');
        
        const expenseForm = document.getElementById('add-expense-form');
        const expenseDesc = document.getElementById('expense-desc');
        const expenseList = document.getElementById('expense-list');

        const settlementList = document.getElementById('settlement-list');
        const settlementCount = document.getElementById('settlement-count');

        function updateBalancesObject() {
            balances = {};
            friends.forEach(f => balances[f.id] = 0);
        }

        friendForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = friendInput.value.trim();
            if(name) {
                addFriend(name);
                friendInput.value = '';
                renderFriends();
                updateExpenseForms();
            }
        });

        function addFriend(name) {
            const friend = { id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name, balance: 0 };
            friends.push(friend);
            updateBalancesObject();
        }

        function renderFriends() {
            friendCount.innerText = friends.length;
            friendList.innerHTML = '';
            friends.forEach(f => {
                const initial = f.name.charAt(0).toUpperCase();
                let bText = "Settled";
                let bClass = "";
                let bAmt = 0;
                
                if(balances[f.id] > 0.01) { bText = "Gets back"; bClass = "balance-positive"; bAmt = balances[f.id]; }
                else if(balances[f.id] < -0.01) { bText = "Owes"; bClass = "balance-negative"; bAmt = Math.abs(balances[f.id]); }

                const el = document.createElement('div');
                el.className = 'card';
                el.innerHTML = `
                    <div class="card-info">
                        <div class="avatar">${initial}</div>
                        <div class="card-details">
                            <h3>${f.name}</h3>
                            <p class="${bClass}">${bText} ${bAmt > 0 ? '$'+bAmt.toFixed(2) : ''}</p>
                        </div>
                    </div>
                `;
                friendList.appendChild(el);
            });
        }

        function updateExpenseForms() {
            const membersContainer = document.getElementById('expense-members');
            payersList.innerHTML = '';
            membersContainer.innerHTML = '';

            friends.forEach(f => {
                const cbLabel = document.createElement('label');
                cbLabel.className = 'member-checkbox';
                cbLabel.style.display = 'flex';
                cbLabel.style.alignItems = 'center';
                cbLabel.style.gap = '0.3rem';
                cbLabel.style.background = 'var(--surface-color)';
                cbLabel.style.border = '1px solid var(--border-color)';
                cbLabel.style.padding = '0.4rem 0.6rem';
                cbLabel.style.borderRadius = '999px';
                cbLabel.style.fontSize = '0.8rem';
                cbLabel.style.cursor = 'pointer';
                cbLabel.innerHTML = `<input type="checkbox" value="${f.id}" checked> ${f.name}`;
                membersContainer.appendChild(cbLabel);

                const payerGroup = document.createElement('div');
                payerGroup.style.display = 'flex';
                payerGroup.style.alignItems = 'center';
                payerGroup.style.gap = '0.5rem';
                payerGroup.innerHTML = `
                    <span style="font-size: 0.85rem; width: 60px; overflow: hidden; text-overflow: ellipsis;">${f.name}</span>
                    <input type="number" class="payer-amount-input" data-id="${f.id}" placeholder="$0" min="0" step="0.01" style="flex: 1; padding: 0.4rem;">
                `;
                payersList.appendChild(payerGroup);
            });
        }

        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if(friends.length < 2) {
                alert("Please add at least 2 participants.");
                return;
            }
            const desc = expenseDesc.value.trim();
            
            const payerInputs = Array.from(document.querySelectorAll('.payer-amount-input'));
            let payersData = [];
            let totalAmount = 0;
            
            payerInputs.forEach(input => {
                const amt = parseFloat(input.value);
                if(amt > 0) {
                    payersData.push({ id: input.getAttribute('data-id'), amount: amt });
                    totalAmount += amt;
                }
            });

            if (totalAmount <= 0.01) {
                alert("Please enter the paid amounts for the people who paid.");
                return;
            }

            const checkedBoxes = Array.from(document.querySelectorAll('#expense-members input:checked'));
            const involvedIds = checkedBoxes.map(cb => cb.value);

            if(involvedIds.length === 0) {
                alert("Please select at least 1 person to share the expense.");
                return;
            }

            if(desc && totalAmount > 0) {
                addExpense(desc, totalAmount, payersData, involvedIds);
                expenseDesc.value = '';
                payerInputs.forEach(i => i.value = ''); // Reset inputs
                recalculateAllBalances();
                renderExpenses();
                renderFriends();
                calculateSettlements();
            }
        });

        function addExpense(description, totalAmount, payersData, involvedIds = null) {
            expenses.push({ id: `e_${Date.now()}`, description, amount: totalAmount, payersData, involvedIds });
        }

        function renderExpenses(limit = 50) {
            expenseList.innerHTML = '';
            const toShow = expenses.slice(-limit).reverse(); 
            toShow.forEach(e => {
                let payerText = 'Multiple People';
                if(e.payersData && e.payersData.length === 1) {
                    payerText = friends.find(f => f.id === e.payersData[0].id)?.name || 'Unknown';
                } else if(!e.payersData && e.payerId) {
                    payerText = friends.find(f => f.id === e.payerId)?.name || 'Unknown';
                }
                const el = document.createElement('div');
                el.className = 'card';
                el.innerHTML = `
                    <div class="card-details">
                        <h3 style="color: var(--text-main)">${e.description}</h3>
                        <p>Paid by ${payerText}</p>
                    </div>
                    <div style="font-weight: 500;">$${e.amount.toFixed(2)}</div>
                `;
                expenseList.appendChild(el);
            });
            if(expenses.length > limit) {
                const info = document.createElement('p');
                info.style.textAlign = 'center';
                info.style.padding = '0.5rem';
                info.style.fontSize = '0.85rem';
                info.style.color = 'var(--text-muted)';
                info.innerText = `+ ${expenses.length - limit} earlier records hidden for performance`;
                expenseList.appendChild(info);
            }
        }

        function recalculateAllBalances() {
            updateBalancesObject();
            if(friends.length === 0) return;
            expenses.forEach(exp => {
                const involved = (exp.involvedIds && exp.involvedIds.length > 0) ? exp.involvedIds : friends.map(f=>f.id);
                const splitAmount = exp.amount / involved.length;
                involved.forEach(id => balances[id] -= splitAmount);
                
                if (exp.payersData) {
                    exp.payersData.forEach(p => balances[p.id] += p.amount);
                } else if (exp.payerId) {
                    balances[exp.payerId] += exp.amount;
                }
            });
        }

        function calculateSettlements() {
            const calcStart = performance.now();
            recalculateAllBalances();

            let debtors = [], creditors = [];
            for (const [id, bal] of Object.entries(balances)) {
                if (bal < -0.01) debtors.push({ id, amount: Math.abs(bal) });
                else if (bal > 0.01) creditors.push({ id, amount: bal });
            }

            debtors.sort((a,b) => b.amount - a.amount);
            creditors.sort((a,b) => b.amount - a.amount);

            let transactions = [];
            let i = 0, j = 0;

            while (i < debtors.length && j < creditors.length) {
                let d = debtors[i], c = creditors[j];
                let minAmt = Math.min(d.amount, c.amount);
                
                if(minAmt > 0.01) {
                    transactions.push({ from: d.id, to: c.id, amount: minAmt });
                }

                d.amount -= minAmt;
                c.amount -= minAmt;

                if (Math.abs(d.amount) < 0.01) i++;
                if (Math.abs(c.amount) < 0.01) j++;
            }

            const calcEnd = performance.now();
            renderSettlements(transactions, calcEnd - calcStart);
            return { transactions, calcTime: calcEnd - calcStart };
        }

        function renderSettlements(transactions, calcTimeMs = 0) {
            const renderStart = performance.now();
            settlementList.innerHTML = '';
            settlementCount.innerText = transactions.length;

            if(transactions.length === 0) {
                settlementList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1.5rem; width: 100%;">No pending settlements.</p>';
                document.getElementById('stat-render').innerText = `0.0ms`;
                return;
            }

            const toRender = transactions.slice(0, 50);
            toRender.forEach(tx => {
                const fromName = friends.find(f => f.id === tx.from)?.name || 'Unknown';
                const toName = friends.find(f => f.id === tx.to)?.name || 'Unknown';
                const el = document.createElement('div');
                el.className = 'settlement-item';
                el.innerHTML = `
                    <div class="settlement-text">
                        <strong>${fromName}</strong> pays <strong>${toName}</strong>
                    </div>
                    <div class="settlement-amount">$${tx.amount.toFixed(2)}</div>
                `;
                settlementList.appendChild(el);
            });

            if (transactions.length > 50) {
                const info = document.createElement('p');
                info.style.textAlign = 'center';
                info.style.padding = '0.5rem';
                info.style.fontSize = '0.85rem';
                info.style.color = 'var(--text-muted)';
                info.innerText = `+ ${transactions.length - 50} more transactions hidden in UI`;
                settlementList.appendChild(info);
            }

            const renderEnd = performance.now();
            document.getElementById('stat-time').innerText = `${calcTimeMs.toFixed(1)}ms`;
            document.getElementById('stat-render').innerText = `${(renderEnd - renderStart).toFixed(1)}ms`;
            document.getElementById('stat-transactions').innerText = transactions.length;
        }

        function resetAll() {
            friends = []; expenses = []; balances = {};
            renderFriends(); updateExpenseForms(); renderExpenses(); calculateSettlements();
            document.getElementById('benchmark-progress').style.width = '0%';
            document.getElementById('stat-time').innerText = `0.0ms`;
            document.getElementById('stat-render').innerText = `0.0ms`;
            document.getElementById('stat-transactions').innerText = `0`;
        }

        function runBenchmark(numUsers, numExpenses) {
            resetAll();
            const pBar = document.getElementById('benchmark-progress');
            pBar.style.width = '10%';

            setTimeout(() => {
                for(let i=0; i<numUsers; i++) addFriend(`User ${i+1}`);
                pBar.style.width = '40%';

                setTimeout(() => {
                    for(let i=0; i<numExpenses; i++) {
                        const randomPayer = friends[Math.floor(Math.random() * friends.length)].id;
                        const randomAmount = Math.floor(Math.random() * 1000) + 10;
                        addExpense(`System Record #${i+1}`, randomAmount, [{id: randomPayer, amount: randomAmount}]);
                    }
                    pBar.style.width = '70%';

                    setTimeout(() => {
                        const { calcTime } = calculateSettlements();
                        renderFriends(); 
                        updateExpenseForms();
                        renderExpenses(10);
                        pBar.style.width = '100%';
                    }, 50);
                }, 50);
            }, 50);
        }

        // Init
        addFriend("Alice");
        addFriend("Bob");
        addFriend("Charlie");
        renderFriends(); updateExpenseForms(); calculateSettlements();
