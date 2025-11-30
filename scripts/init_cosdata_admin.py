"""Initialize Cosdata with admin key via Docker."""
import subprocess
import time
import requests
import sys

def init_cosdata():
    """Run Cosdata with piped admin key input."""
    print("🚀 Starting Cosdata initialization...")
    
    # Clean up any orphaned containers
    subprocess.run(
        ["docker", "compose", "-f", "infra/docker-compose.yaml", "down", "--remove-orphans"],
        cwd=".",
        capture_output=True,
    )
    
    # Remove old volume
    subprocess.run(
        ["docker", "volume", "rm", "infra_cosdata_data"],
        capture_output=True,
    )
    
    # Start Cosdata with input
    # Use stdin to provide the admin key twice (entry + confirmation)
    admin_key = "cosdata123"
    input_data = f"{admin_key}\n{admin_key}\n".encode()
    
    print(f"📝 Setting admin key: {admin_key}")
    print("⏳ Starting Cosdata container...")
    
    try:
        proc = subprocess.Popen(
            ["docker", "compose", "-f", "infra/docker-compose.yaml", "run", "-T", "cosdata"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=".",
        )
        
        stdout, stderr = proc.communicate(input=input_data, timeout=60)
        
        print(stdout.decode())
        if proc.returncode != 0:
            print("stderr:", stderr.decode())
            print("⚠️  Cosdata setup may have failed, but container should be initialized")
    
    except subprocess.TimeoutExpired:
        proc.kill()
        stdout, stderr = proc.communicate()
        print("⏱️  Timeout - container may still be initializing")
    
    # Now start all services in background
    print("\n✅ Cosdata initialized. Starting full stack...")
    subprocess.run(
        ["docker", "compose", "-f", "infra/docker-compose.yaml", "up", "-d"],
        cwd=".",
    )
    
    # Wait for backend to be ready
    print("⏳ Waiting for services to start...")
    for i in range(30):
        try:
            resp = requests.get("http://localhost:8000/api/v1/health", timeout=2)
            if resp.status_code == 200:
                print("✅ Backend is ready!")
                print("\n🎯 Success! Services running:")
                print("  - Backend: http://localhost:8000")
                print("  - Cosdata: http://localhost:8443 (admin/cosdata123)")
                print("  - Neo4j: http://localhost:7474 (neo4j/password)")
                print("  - PostgreSQL: localhost:5432 (postgres/postgres)")
                return
        except requests.RequestException:
            pass
        print(f"  Waiting... ({i+1}/30)")
        time.sleep(1)
    
    print("⚠️  Services may still be starting. Check with: docker compose logs")

if __name__ == "__main__":
    init_cosdata()
