function novoElemento(tagName, className) {
  const elem = document.createElement(tagName)
  elem.className = className

  return elem
}

// Vai ser duas barreiras uma de cima e uma de baixo
// Reversa é a barreira de cima
function Barreira(reversa = false) {
  this.elemento = novoElemento('div', 'barreira')

  const borda = novoElemento('div', 'borda')
  const corpo = novoElemento('div', 'corpo')

  this.elemento.appendChild(reversa ? corpo : borda)
  this.elemento.appendChild(reversa ? borda : corpo)

  // Setar altura da barreira
  this.setAltura = altura => corpo.style.height = `${altura}px`
}

function ParDeBarreiras(altura, abertura, x) {
  this.elemento = novoElemento('div', 'par-de-barreiras')

  // vai criar duas barreiras, a barreira superior e a barreira inferior
  this.superior = new Barreira(true)
  this.inferior = new Barreira()

  // vai adicionar as barreiras no elemento par-de-barreiras
  this.elemento.appendChild(this.superior.elemento)
  this.elemento.appendChild(this.inferior.elemento)

  // Abertura para o 'bird' passar
  this.sortearAbertura = () => {
    const alturaSuperior = Math.random() * (altura - abertura)
    const alturaInferior = altura - abertura - alturaSuperior

    this.superior.setAltura(alturaSuperior)
    this.inferior.setAltura(alturaInferior)
  }

  // Pegar a possição x do par-de-barreiras
  this.getX = () => parseInt(this.elemento.style.left.split('px')[0])
  this.setX = x => this.elemento.style.left = `${x}px`

  this.getLargura = () => this.elemento.clientWidth

  // vai começar sorteando as barreiras e setar a posição delas
  this.sortearAbertura()
  this.setX(x)
}

function Barreiras(altura, largura, abertura, espaco, notificarPonto) {
  // Barreiras iniciais
  this.pares = [
    new ParDeBarreiras(altura, abertura, largura),
    new ParDeBarreiras(altura, abertura, largura + espaco),
    new ParDeBarreiras(altura, abertura, largura + espaco * 2),
    new ParDeBarreiras(altura, abertura, largura + espaco * 3),
  ]

  // Quanto em quanto pixel vai sendo deslocado as barreiras
  const deslocamento = 3

  this.animar = () => {
    this.pares.forEach(par => {
      par.setX(par.getX() - deslocamento)

      // Quando o elemento sair da área do jogo
      if (par.getX() < -par.getLargura()) {
        par.setX(par.getX() + espaco * this.pares.length)

        // vai sortear novamente para que a barreiras apareça diferente
        par.sortearAbertura()
      }

      const meio = largura / 2
      const cruzouOMeio = par.getX() + deslocamento >= meio && par.getX() < meio

      if (cruzouOMeio) {
        notificarPonto()
      }
    })
  }
}

function Passaro(alturaJogo) {
  let voando = false

  this.elemento = novoElemento('img', 'bird')
  this.elemento.src = 'img/passaro.png'

  this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0])
  this.setY = y => this.elemento.style.bottom = `${y}px`

  // se qualquer tecla tiver presionada o passaro vai voar
  window.onkeydown = e => voando = true
  // se soltar a tecla ele vai parar de voar
  window.onkeyup = e => voando = false

  this.animar = () => {
    const novoY = this.getY() + (voando ? 8 : -5)
    const alturaMaxima = alturaJogo - this.elemento.clientHeight

    if(novoY <= 0) {
      this.setY(0)
    } else if(novoY >= alturaMaxima) {
      this.setY(alturaMaxima)
    } else {
      this.setY(novoY)
    }
  }

  this.setY(alturaJogo / 2)

}

function Progresso() {
  this.elemento = novoElemento('span', 'points')

  this.atualizarPontos = pontos => {
    this.elemento.innerHTML = pontos
  }

  this.atualizarPontos(0)
}

function estaoSobrepostos(elementoA, elementoB) {
  // Retangulo associado ao elemento a e b
  const retanguloA = elementoA.getBoundingClientRect()
  const retanguloB = elementoB.getBoundingClientRect()

  // se os retangulos estão sobreposto na horizontal

  // retanguloA.left + retanguloA.width == o lado direito do retanguloA
  const ladoDireitoA = retanguloA.left + retanguloA.width
  const ladoDireitoB = retanguloB.left + retanguloB.width
  const horizontal = ladoDireitoA >= retanguloB.left && ladoDireitoB >= retanguloA.left

  // retanguloA.top + retanguloA.height == parte de baixo do retanguloA
  const parteDeBaixoA = retanguloA.top + retanguloA.height
  const parteDeBaixoB = retanguloB.top + retanguloB.height
  const vertical = parteDeBaixoA >= retanguloB.top && parteDeBaixoB >= retanguloA.top

  return horizontal && vertical
}

function colisao(passaro, barreiras) {
  let colisao = false

  barreiras.pares.forEach(ParDeBarreiras => {
    // Verificar se ele colidiu a parte de cima e a parte de baixo
    if(!colisao) {
      const superior = ParDeBarreiras.superior.elemento
      const inferior = ParDeBarreiras.inferior.elemento

      colisao = estaoSobrepostos(passaro.elemento, superior)
        || estaoSobrepostos(passaro.elemento, inferior)
    }
  })

  return colisao
}

function FlappyBird() {
  let pontos = 0

  const areaDoJogo = document.querySelector('[wm-flappy]')
  const restart = novoElemento('div', 'restart')
  restart.innerHTML = 'Reniciar'

  // pegar altura do jogo automaticamente
  const altura = areaDoJogo.clientHeight
  const largura = areaDoJogo.clientWidth

  const progresso = new Progresso()
  const barreiras = new Barreiras(altura, largura, 200, 400,
    () => progresso.atualizarPontos(++pontos))

  const passaro = new Passaro(altura)

  areaDoJogo.appendChild(progresso.elemento)
  areaDoJogo.appendChild(passaro.elemento)
  barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

  this.start = () => {
    // loop do jogo
    const temporizador = setInterval(() => {
      barreiras.animar()
      passaro.animar()

      if(colisao(passaro, barreiras)) {
        clearInterval(temporizador)
        areaDoJogo.appendChild(restart)
        restart.addEventListener('click', start)
      }
    }, 20)
  }
}

function start() {
  const areaDoJogo = document.querySelector('[wm-flappy]')

  areaDoJogo.innerHTML = ''

  new FlappyBird().start()
}

start()
