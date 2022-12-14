const coingecko = 'https://api.coingecko.com/api/v3/'
const cryptocompare = 'https://min-api.cryptocompare.com/data/'
const top100coins = JSON.parse(localStorage.getItem('top100coins'))
const selectedcoins = new Set()
var selectedSymbols = new Set(['XRP', 'ETH', 'BTC'])
const allCoins = JSON.parse(localStorage.getItem('allCoins'))
const TIMEOUT = 120000
var pageNum = 1
var search = []

const colorPalette = [
    '#F0D237',
    '#F78B6D',
    '#FA6672',
    '#32DBA2',
    '#B096E0',
]

var graphData = [{
    label: 'BTC',
    data: [],
    fill: false,
    borderColor: '#F0D237',
    tension: 0.2,
  },
]
var timeData = []


const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: timeData,
        datasets: graphData
    },
    options: {
        maintainAspectRatio: false,
        animation: false,
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time (2s intervals)'
                },
                ticks: {
                    autoSkip: true,
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'USD'
                },
            },
        },
        plugins: {
            title: {
                display: true,
                text: 'Crypto Chart',
                font: {
                    size: 16
                }
            },

        }
    }
});

var addChartData = setInterval(() => {
    if (selectedSymbols.size > 0) {
        $.ajax({
            url: cryptocompare + `pricemulti?fsyms=${Array.from(selectedSymbols).join(',')}&tsyms=USD`,
            type: 'GET',
            success: (res) => {
                if (timeData.length > 14) {
                    timeData.shift();
                    graphData.map((c) => c.data.shift());
                }
                timeData.push(new Date().toLocaleTimeString().split(' ')[0]);
                graphData.map((c) => {
                    c.data.push(Object.values(res[c.label])[0])
                });
                myChart.update();
            },
            error: (err) => { 
                console.log(err); 
                $('#spinner-graph').removeClass('invisible');
            }
        })
    } else {
        myChart.update();
    }

}, 2000);

const pageObserver = new IntersectionObserver((entries) => {
    const lastCoin = entries[0];
    if (!lastCoin.isIntersecting) return
    if (search.length == 0) {
        appendPage(pageNum);
    } else {
        appendSearchCoins()
    }
    pageObserver.unobserve(lastCoin.target);
}, 
{
    threshold: 0,
    rootMargin: "400px",
});

const coinObserver = new IntersectionObserver((entries) => {
    $(entries[0].target).parent().prevAll().slice(0, 100).each((idx, elem) => {
        elem.children[0].classList.toggle('line-up', true);
        coinObserver.unobserve(elem.children[0]);
    });
    entries.forEach((entry => {
        entry.target.classList.toggle('line-up', entry.isIntersecting);
        if (entry.isIntersecting) {coinObserver.unobserve(entry.target)}
    }));
},{
    threshold: 0,
    rootMargin: '0px',
})

const aboutObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if(entry.isIntersecting) {
            Array.from(entry.target.children).forEach((child) => {
                child.classList.toggle('transform-zero', true);
            })
            coinObserver.unobserve(entry.target);
        }
    })
}, {
    threshold: 0, 
    rootMargin: '0px'
})

if (!allCoins?.time || allCoins?.time - Date.now() > TIMEOUT) {
    $.ajax({
        url: coingecko + 'coins/list',
        type: 'GET',
        success: (res) => {
            localStorage.setItem('allCoins', JSON.stringify({'coins' : res, 'time': Date.now()}));
        },
        error: (e) => console.log(e)
    })
}

function changeGraphCoins(symbols) {
    graphData.splice(0, graphData.length);
    timeData.splice(0, timeData.length);

    symbols.map((sym, idx) => [
        graphData.push({
            label: sym,
            data: [],
            fill: false,
            borderColor: colorPalette[idx],
            tension: 0.2,
        })
    ])
}

function loadfirst() {
    pageNum = 1
    if (top100coins?.time && top100coins?.time - Date.now() < TIMEOUT) {
        $('#coins-grid').html('');
        if(top100coins.coins.length){
            pageNum++;
            append_coins(top100coins.coins);
            pageObserver.observe(document.querySelector("#coins-grid > [class^='col']:last-child"));
        }
    } else {
        $.ajax({
            url: coingecko + `coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${pageNum}&sparkline=false`,
            type: 'GET',
            success: (res) => {
                if (res.length){
                    $('#coins-grid').html('');
                    append_coins(res);
                    localStorage.setItem('top100coins', JSON.stringify({'coins': res, 'time': Date.now()}));
                    pageObserver.observe(document.querySelector("#coins-grid > [class^='col']:last-child"));
                    pageNum++;
                } else {
                    pageObserver.disconnect();
                    $('#spinner-coins').html('<div class="text-success text-center">All coins loaded successfully <i class="bi bi-check-square"></i></div');
                }
            },
            error: (e) => console.log(e),
        })
    }
}
loadfirst()



function appendPage(pageNumber) {
    return $.ajax({
        url: coingecko + `coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${pageNumber}&sparkline=false`,
        type: 'GET',
        success: (res) => {
            if (res.length) {
                append_coins(res);
                pageNum++;
                pageObserver.observe(document.querySelector("#coins-grid > [class^='col']:last-child"));
            } else {
                pageObserver.disconnect();
                $('#spinner-coins').html('<div class="text-success text-center">All coins loaded successfully <i class="bi bi-check-square"></i></div>');
            }
        },
        error: (e) => {
            console.log(e);
            $('#spinner-coins').html('<div class="text-danger text-center">Error from api <i class="bi bi-x"></i></div>');
        },
    })
}

function invisible_search() {
    $('#search-form').addClass('invisible');
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

function coin_info(btnObj){
    if ($(btnObj).attr('aria-expanded') === 'true') {
        let moreInfo = JSON.parse(localStorage.getItem('moreInfo'));
        if (moreInfo === null) moreInfo = {};
        if (btnObj.value in moreInfo && moreInfo[btnObj.value].last_updated_at - Date.now() < TIMEOUT) {
            showMoreInfo(btnObj, moreInfo);
            return
        } 
        $.ajax({
            url: coingecko + `simple/price?ids=${btnObj.value}&vs_currencies=usd%2Ceur%2Cils&include_market_cap=true&include_last_updated_at=true`,
            type: 'GET',
            success: (res) => {
                showMoreInfo(btnObj, res);
                moreInfo[btnObj.value] = res[btnObj.value];
                localStorage.setItem('moreInfo', JSON.stringify(moreInfo));
            },
            error: (e) => console.log(e, btnObj.value),
        })
    }
}

function showMoreInfo(btnObj, theInfo) {
    $(btnObj).next().html(
        `<div>
           <b>USD:</b> <span class="text-primary">${numberWithCommas(theInfo[btnObj.value].usd)}</span>$
        </div>
        <div>
            <b>EUR:</b> <span class="text-primary">${numberWithCommas(theInfo[btnObj.value].eur)}</span>???
        </div>
        <div>
            <b>ILS:</b> <span class="text-primary">${numberWithCommas(theInfo[btnObj.value].ils)}</span>???
        </div>
        <div>
            Market Cap: <span class="text-muted">${numberWithCommas(theInfo[btnObj.value].usd_market_cap)}</span>$
        </div>
        `
    );
}

function updateSymbols() {
    selectedSymbols = new Set();
    for(let c of selectedcoins) {
        let thisCoin = allCoins.coins.filter(coin => c === coin.id)[0];
        selectedSymbols.add(thisCoin.symbol.toUpperCase());
    }
    changeGraphCoins([...selectedSymbols]);
}

function handle_selectedcoins(btnObj) {
    if (btnObj.checked) {
        if (selectedcoins.size < 5){
            toggleSelectedCard(btnObj);
            selectedcoins.add(btnObj.value);
            updateSymbols(); // UpdateSymbols
        } else {
            btnObj.checked = false
            $('#selected-coins-modal').html(Array.from(selectedcoins).map((c) => 
            `<div class="my-1">
                <button type="button" class="btn btn-danger" onclick="deleteSelectedCoin(this)" value="${c},${btnObj.value}">Remove</button>
                ${c}
            </div>
            `));   
            $('#deselect-modal').modal('show');
        }
    } else {
        toggleSelectedCard(btnObj);
        selectedcoins.delete(btnObj.value);
        updateSymbols();
    }
}

function toggleSelectedCard(btnObj) {
    const cardParent = btnObj.parentNode.parentNode.parentNode.parentNode;
    cardParent.classList.toggle('bg-light');
    cardParent.classList.toggle('selected');
}

function deleteSelectedCoin(btnObj) {
    const [delCoin, addCoin] = btnObj.value.split(',');
    $('#select-' + delCoin).prop('checked', false);
    toggleSelectedCard($('#select-' + delCoin).get(0));
    selectedcoins.delete(delCoin);
    $('#select-' + addCoin).prop('checked', true).addClass('selected').addClass('bg-light');
    toggleSelectedCard($('#select-' + addCoin).get(0));
    selectedcoins.add(addCoin);
    updateSymbols();
    $('#deselect-modal').modal('hide');
}

function append_coins(coins) {
    const $cg = $('#coins-grid')
    coins.map((coin) => {
        $cg.append(`<div class="col-sm-12 col-md-6 col-lg-4 px-0">
        <div class="card pb-0 h-100">
            <div class="card-body">
                <div class="card-title d-flex justify-content-between my-0">
                    <h4 class="d-flex align-items-center">${coin?.image !== undefined ? `<img src=${coin?.image} class="img img-responsive mx-1" style="width: 32px;" />` : ''}${coin.symbol.toUpperCase()}</h4>
                    <label class="switch">
                        <input type="checkbox" onchange="handle_selectedcoins(this)" value=${coin.id} id="select-${coin.id}"/>
                        <span class="slider round"></span>
                    </label>
                </div>                        
                <div class="card-text my-2">
                    ${coin.name}
                </div>
                <button value="${coin.id}" onClick="coin_info(this);" class="btn btn-primary mb-2" type="button" data-bs-toggle="collapse" data-bs-target="#info-${coin.id}" aria-expanded="false" aria-controls="info-${coin.id}" >More info</button>
                <div class="collapse p-2 light-box-shadow blue-light-bg" id="info-${coin.id}">
                    <div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
                </div>
            </div>
        </div>
    </div>`)
        coinObserver.observe($cg.children().get(-1).children[0]);
    })
}

function appendSearchCoins() {
    pageNum++;
    if (pageNum * 100 < search.length + 100) {
        let nextPage = search.slice((pageNum-1)*100, pageNum * 100);
        $.ajax({
            url: coingecko + `coins/markets?vs_currency=usd&ids=${nextPage.map(x => x.id).join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
            type: 'GET',
            success: (res) => {
                append_coins(res, res.length);
                pageObserver.observe(document.querySelector("#coins-grid > [class^='col']:last-child"));
            },
            error: (err) => { console.log(err);}
        }) 
    } else {
        pageObserver.disconnect();
        $('#spinner-coins').html('<div class="text-success text-center">All coins loaded successfully <i class="bi bi-check-square"></i></div>');
    }
}


$(() => {
    // $('.top-text h1').first().css('transform', 'translateX(105%)');
    // $('.top-text h1:eq(1)').css('transform', 'translateX(125%)');
    // $('.top-text h1').last().css('transform', 'translateX(145%)');

    // Search function
    $('#search-form').submit((e) => {
        pageNum = 1;
        e.preventDefault();
        if(e.target[0].value === '') {
            search = [];
            loadfirst();
            return;
        }
        search = allCoins.coins.filter(coin => coin.symbol.includes(e.target[0].value.toLowerCase()));
        let firstSearch = search.slice((pageNum-1)*100, pageNum * 100);
        
        coinObserver.disconnect();
        pageObserver.disconnect();
        $('#coins-grid').html('');

        if (search.length > 0) {
            $.ajax({
                url: coingecko + `coins/markets?vs_currency=usd&ids=${firstSearch.map(x => x.id).join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
                type: 'GET',
                success: (res) => {
                    append_coins(res);
                    pageObserver.observe(document.querySelector("#coins-grid > [class^='col']:last-child"));
                },
                error: (err) => { console.log(err);}
            }) 
        } else {
            $('#spinner-coins').html('<div class="text-success text-center">All coins loaded successfully <i class="bi bi-check-square"></i></div>');
        }
    })
    $('#search-input').change(() => {
        if($('#search-input').val() === '') {
            coinObserver.disconnect();
            pageObserver.disconnect();
            search = [];
            loadfirst();
            return;
        }
    })

    if ($(window).width() > 992) {
        $('.top-image').css({'min-height': $(window).height() - $('#myNav').height() - 10,});
    } else {
        $('.top-image').css({'min-height': $(window).height(),});
    }

    $('#scroll-down').click(() => {
        $(window).scrollTop($(window).height() - ($(window).width() > 992 ? $('#myNav').height() : 0) + 5);
    });
    $('#scroll-up').click(() => {
        $(window).scrollTop(0);
    });

    $('#pills-profile-tab, #pills-about-tab').click(invisible_search);
    $('#pills-coins-tab').click(() => $('#search-form').removeClass('invisible'));

    aboutObserver.observe($('.about-text-main').get(0))

    $('#pills-about .row').each((idx, elem) => {
        aboutObserver.observe(elem.children[0]);
    })

})

$(window).resize(() => {
    if ($(window).width() > 992) {
        $('.top-image').css({'min-height': $(window).height() - $('#myNav').height() - 10,});
    } else {
        $('.top-image').css({'min-height': $(window).height(),});
    }
});
$(window).scroll(() => {
    let scroll = $(window).scrollTop();
    $('#myNav').css({'opacity': 0.7 + scroll/1000, 'box-shadow' : `0 0 100px rgba(255, 255, 255, ${0.5 + scroll/500})` });
    $('.top-text h1').css({'opacity': 1 - scroll/1000, 'filter' : `blur(${(scroll-100)/100}px)`});
    $('#scroll-down').css({'opacity': 1 - (scroll-200)/700});

    if (scroll == 0){
        $('.top-text h1').css({'filter' : 'blur(0px)'});
    }

    if (scroll > ($(window).height() - $('#myNav').height() - 10)) {
        $('#scroll-up').removeClass('invisible');
    } else {
        $('#scroll-up').addClass('invisible');
    }
});