#[tokio::main]
async fn main() {
    println!("Consumer running...");
    loop {
        tokio::time::sleep(std::time::Duration::from_secs(10)).await;
    }
}

