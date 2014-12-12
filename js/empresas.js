var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

var empresas = ["JBS"],
    mudou = null
    formatNumber = d3.format(",d"),
    nodes = [],
    links = [],
    arquivo = null,
    width = $("#container").width()*1.1,
    height = 1000,
    color = d3.scale.category20();

var svg = d3.select("#grafico").append("svg")
        .attr("width", width)
        .attr("height", height);

var force = d3.layout.force()
        .nodes(nodes)
        .links(links)
        .charge(-600)
        .linkDistance(-50)
        .gravity(0.3)
        .linkStrength(0.45)
        .friction(0.4)
        .chargeDistance(50000)
        .size([width, height])
        .on("tick", tick);

var drag = force.drag()
    .on("dragstart", dragstart);

var node = svg.selectAll(".node"),
    link = svg.selectAll(".link")

function muda_empresa(d) {
    novas_empresas = getValue()
    if (novas_empresas.length < empresas.length) {
        empresas.forEach(function (d) { if (novas_empresas.indexOf(d) == -1) mudou = d})
    } else {
        mudou = null
    }
    empresas = novas_empresas
    atualizar()
}

function getValue() {
  var x=document.getElementById("doadores");
  var saida = []
  for (var i = 0; i < x.options.length; i++) {
     if(x.options[i].selected ==true){
          saida.push(x.options[i].value);
      }
  }
  return saida
}

function dragstart(d) {
  d3.select(this).classed("fixed", d.fixed = true);
}

function filtra_dados(deus) {
    var temp = deus.links.filter(function (d) { return empresas.indexOf(d.empresa) != -1})
    var candidatos = []
    temp.forEach(function (d) { candidatos.push(d.candidato)})
    candidatos = candidatos.concat(empresas)
    var novos_nodes = deus.nodes.filter(function (d) { return candidatos.indexOf(d.name) != -1 })
    var novos_links = []
    var temp_empresas = deus.nodes.filter(function (d) { return empresas.indexOf(d.name) != -1})
    var trad_empresas = {}
    temp_empresas.forEach(function (d,e) { trad_empresas[d.name] = e })
    novos_nodes.forEach(function (d) { 
        var empresas_nesse_caso = []
        temp.forEach(function (ligacao) { if (ligacao.candidato == d.name) empresas_nesse_caso.push(ligacao.empresa) })
        empresas_nesse_caso.forEach(function (emp) { 
            var ligacao = {source:d,target:temp_empresas[trad_empresas[emp]]}
            novos_links.push(ligacao)
        })
    })
    return [novos_links,novos_nodes]
}

function busca_candidato(nodes_temp,candidato) {
    var saida = null
    nodes_temp.forEach(function (d) { if (d.name == candidato) { saida = d.index } })
    return saida
}


function acha_cor(d) {
    if (d.group ==1) {
        return "#4d5266"
    } else {
        if (d.partido == "PT") return "#690000"
        else if (d.partido == "PSDB") return "#1e2e66"
        else if (d.partido == "PMDB") return "#6b4200"
        else if (d.partido == "PSD") return "#4f5d15"
        else if (d.partido == "PP") return "#a6546f"
        else return "#666e87"
    }
}

function carrega_dados() {
    d3.json("jbs.json", function(error, dados) {
        arquivo = dados
        comecar()
    })
}
function start() {
  link = link.data(force.links())
  link.enter().append("line")
        .attr("name",function (d) { return d.target.name})
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });
    link.exit().remove();

  node = node.data(force.nodes(), function(d) { return d.name;});
  node.enter().append("circle")
      .attr("class", "node")
      .attr("name",function (d) { return d.name })
      .attr("r", function (d) { if (d.group == 1) {return Math.max(70*(d.valor/54577777),8) } else { return 5}})
      .style("fill", function(d) {
          //    return color(d.group);
              return acha_cor(d)
      })
      .style("stroke",function (d) {
                //return "#fff"
            return acha_cor(d)
      })
      .style("fill-opacity", function (d) {
           if (d.group ==1 ) return 1
           else return 0.35
      })
      .style("stroke-opacity",0.5)

      .call(drag);
    
    node.on('mouseover', function(d) {

        div.transition()
                .duration(200)
                .style("opacity", 1);
        if (d.group == 3) {
            div.html(d.name + " ("+ d.partido+")")
        } else {
            div.html("<b>"+d.name+"</b><br>Total doado: R$"+formatNumber(Math.round(d.valor)).replace(",",".").replace(",","."))
        }
        div.style("left", (d3.event.pageX - 20) + "px")
           .style("top", (d3.event.pageY - 50) + "px")})

  node.on('mousemove', function(d) {
       div.style("left", (d3.event.pageX - 20) + "px")
          .style("top", (d3.event.pageY - 50) + "px");
  })

  node.on("mouseout", function(d) {
      div.transition()
              .duration(500)
              .style("opacity", 0);
  });
//tira o node se clicar em cima
/*  node.on("click",function(d) {
      if (d3.event.defaultPrevented) return; // click suppressed
      if (d.group == 1) {
          selecionados = $("#doadores").val()
          if (selecionados == null) { selecionados = []}
          if (selecionados.indexOf(d.name) == -1) selecionados.push(d.name)
          else {
              var saida = []
              for (s in selecionados) {
                  if (selecionados[s] != d.name) {
                      saida.push(selecionados[s])
                      }
                  }
              selecionados = saida
              }
          $("#doadores").val(selecionados)
          empresas = selecionados
          atualizar()
      }
  })*/
  node.exit().remove();
  force.start()
}

function comecar() {        
    var filtrado = filtra_dados(arquivo)
    links = filtrado[0]
    force.links(links)
    nodes = filtrado[1]
    force.nodes(nodes);         
    start()
    $("#doadores").trigger("chosen:updated");
}

function atualizar() {
    var filtrado = filtra_dados(arquivo)
    links = filtrado[0]
    force.links(links)
    nodes = filtrado[1]
    force.nodes(nodes);
    force.stop() 
    start()
    $("#doadores").trigger("chosen:updated");
    
}

function tick() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
}
carrega_dados();