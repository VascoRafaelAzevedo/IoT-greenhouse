# ⚡ Setup & Installation

This README is a walk-through for setting up the **Garden Away IoT System** locally or on a server using Docker and Docker Compose. It assumes a Linux environment (Ubuntu is recommended) but can be adapted for use on macOS.

---

## 🛠 Prerequisites

Before starting, make sure the following are installed and configured:

- **Docker** (latest stable)  
  - [Docker installation guide](https://docs.docker.com/get-docker/)  
- **Docker Compose**  
  - [Compose installation guide](https://docs.docker.com/compose/install/)  
- **VSCode or any editor** (optional, for editing configs)  
- Open firewall ports (if running remotely):  
  - MQTT: `1883`  
  - API: `5000` (or your configured port)  
  - PostgreSQL: `5432` (only if remote access needed)  

> Note: If you pretend to run it in an Oracle Instance, make sure to adapt the ingress rules in the network and subnet being used by your instance in the Orace website. 

---

## 🔑 Environment Variables

Create a `.env` file at the root of the project (never commit it to GitHub, maintain it in .gitignore).

There is a `.env.example` file in the root folder of this project. Copy its contents and change the values.


---

## 🐳 Docker Compose

O projeto é orquestrado com **Docker Compose**. Ele define e executa os múltiplos *containers* (serviços) necessários para o ambiente de desenvolvimento.

Certifique-se de que o seu ficheiro `.env` está configurado antes de prosseguir.

---

## 🚀 Running the Project

Siga estes passos para colocar todos os serviços a correr:

1.  **Clone o repositório** e entre na pasta do projeto:

    ```bash
    git clone <repo-url>
    cd <repo-folder>
    ```

2.  **Crie e configure o ficheiro `.env`** (se ainda não o fez):

    ```bash
    cp .env.example .env
    nano .env
    ```

3.  **Inicie os *containers* de infraestrutura** (Postgres/TimescaleDB e Mosquitto):

    ```bash
    docker-compose up -d postgres mosquitto
    # Ou 'docker-compose up -d' para iniciar todos os serviços
    ```

4.  **Verifique os *containers* em execução**:

    ```bash
    docker ps
    ```
    Deverá ver, inicialmente, os *containers* para:
    * `postgres` (PostgreSQL com TimescaleDB)
    * `mosquitto` (MQTT Broker)
    * (Mais tarde, após mais *builds*: `api`, `consumer`, `worker`, `frontend`)

5.  **Verifique a inicialização da base de dados** (opcional, para confirmar que o Postgres está pronto):

    ```bash
    docker exec -it <postgres-container-name-or-id> psql -U $DB_USER
    # dentro do psql
    \dt
    \q
    ```
    Substitua `$DB_USER` pelo nome de utilizador definido no seu `.env` (tipicamente `postgres`).

6.  **Teste o MQTT Broker** (opcional, para confirmar a autenticação):

    ```bash
    # Abra uma nova shell ou execute num container, e substitua as variáveis
    docker exec -it <mosquitto-container-name-or-id> mosquitto_sub -h localhost -t "test/topic" -u $MQTT_USER -P $MQTT_PASSWORD
    ```
    Se tudo estiver correto, a subscrição deverá ficar à espera de mensagens.

7.  **Inicie os serviços da aplicação** (API, Worker, Consumer, etc.), se não os iniciou no passo 3:

    ```bash
    docker-compose up -d api consumer worker #
    ```

---

## ⚡ Notas Importantes

* **Segurança Mosquitto**: A configuração do Mosquitto **deve** impor autenticação (sem acesso anónimo) e utilizar as credenciais definidas no `.env`.
* **Portas**: Exponha portas apenas se necessitar de acesso externo para testes ou produção. Para desenvolvimento local, as comunicações entre *containers* são internas.
* **Ordem de Início**: Certifique-se de que o **Postgres/TimescaleDB** e o **Mosquitto** estão completamente operacionais antes de iniciar os serviços da aplicação (API, *consumer*, *worker*).

---
