# Descrição

Playwright para acessar meu site ecommerce (https://louren.co.in/ecommerce/home.html) simulando centenas de usuários,
utilizando Google Cloud Functions, geração 2.

Importante: essa versão não implementa state storage, porque o filesystem da cloud function é read-only, e tem que
pagar storage extra. Devido a isso, cada aba de navegação é considerado um usuário novo. Ou seja, esses usuários
não têm histórico de sessões. Cada navegação será feita por um usuário distinto. E está tudo bem. É só para gerar
algum tráfego com qualidade duvidosa na minha propriedade. hehe


# Uso

```bash
# logar no GCP
gcloud auth login
# ver os projetos
gcloud projects list
# listar o projeto atual
gcloud config get project
# escolher o projeto correto
gcloud config set project <nome do projeto com cloud funcions ativado>
# cria a cloud function com o código node em index.ts
gcloud functions deploy run --entry-point run --allow-unauthenticated --trigger-http --runtime nodejs16 --memory=1G --region=us-central1 --max-instances=20 --timeout=3600 --gen2
```

Para executar a função, em teoria daria para fazer `gcloud functions call run`, mas tem bug para gen2 fazendo dessa forma.
Portanto, a única forma é fazendo uma requisição GET para a rota gerada na cloud function. Para descobrir a url: `gcloud functions describe run`.
O endpoint está em serviceConfig > uri.


Nota: o código acima permite atender até 4 chamadas concorrentes. Em meus testes, isso é suficiente para criar
aproximadamente 1000 usuários (ou fluxos), e tem duração de 30 minutos.


# Referências:

- Como usar Cloud Functions com typescript: https://duff.blog/cloud-functions-with-typescript