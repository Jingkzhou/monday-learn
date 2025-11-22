import httpx
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"
EMAIL = "diagnosis_test@example.com"
PASSWORD = "password123"

def register_and_login():
    # Register
    try:
        httpx.post(f"{BASE_URL}/auth/signup", json={
            "email": EMAIL,
            "password": PASSWORD,
            "username": "DiagnosisUser"
        })
    except:
        pass # Maybe already exists

    # Login
    resp = httpx.post(f"{BASE_URL}/auth/login", data={
        "username": EMAIL,
        "password": PASSWORD
    })
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        exit(1)
    return resp.json()["access_token"]

def run_verification():
    token = register_and_login()
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Logged in")

    # 1. Create Study Set
    resp = httpx.post(f"{BASE_URL}/study-sets", headers=headers, json={
        "title": "Diagnosis Test Set",
        "description": "Testing diagnosis",
        "is_public": False
    })
    if resp.status_code != 200:
        print(f"Create set failed: {resp.text}")
        exit(1)
    set_id = resp.json()["id"]
    print(f"✅ Created Study Set: {set_id}")

    # 2. Add Terms
    terms = [
        {"term": "Apple", "definition": "A fruit"},
        {"term": "Banana", "definition": "Yellow fruit"},
        {"term": "Carrot", "definition": "Orange vegetable"},
        {"term": "Dog", "definition": "Animal"},
        {"term": "Elephant", "definition": "Big animal"}
    ]
    term_ids = []
    for t in terms:
        r = httpx.post(f"{BASE_URL}/study-sets/{set_id}/terms", headers=headers, json=t)
        term_ids.append(r.json()["id"])
    print(f"✅ Added {len(term_ids)} terms")

    # 3. Submit Incorrect Answers (for first 3 terms)
    # We need to submit multiple incorrect answers to make them "high frequency"
    # The logic sorts by incorrect count.
    for tid in term_ids[:3]:
        for _ in range(2): # 2 incorrect answers each
            httpx.post(f"{BASE_URL}/learning/{set_id}/log", headers=headers, json={
                "term_id": tid,
                "mode": "test",
                "is_correct": False,
                "user_answer": "Wrong",
                "expected_answer": "Right",
                "time_spent_ms": 1000
            })
    print("✅ Submitted incorrect answers")

    # 4. Generate Report
    print("⏳ Generating Report (this calls AI, might take a few seconds)...")
    
    # We need to handle potential 503 if no AI config
    resp = httpx.post(f"{BASE_URL}/learning/report", headers=headers, json={"timeframe": "本周"}, timeout=30.0)
    
    if resp.status_code == 503:
        print("⚠️ AI Service unavailable (no config). Skipping AI content check, but logic should be tested.")
        # If 503, we can't test the rest because `generate_learning_report` raises exception.
        pass
    elif resp.status_code != 200:
        print(f"❌ Generate report failed: {resp.text}")
        exit(1)
    else:
        data = resp.json()
        print("✅ Report Generated")
        print(f"   Report ID: {data.get('report_id')}")
        print(f"   Suggestion: {data.get('suggestion_create_set')}")
        
        if not data.get('suggestion_create_set'):
            print("❌ Expected suggestion_create_set to be True")
            # Debug: print raw stats
            print(data.get('raw_stats'))
        else:
            # 5. Verify Mistakes Data (Frontend needs term + definition)
            raw_stats = data.get('raw_stats', {})
            top_mistakes = raw_stats.get('top_mistakes', [])
            if not top_mistakes:
                print("❌ No top_mistakes found in raw_stats")
            else:
                first_mistake = top_mistakes[0]
                if 'definition' not in first_mistake:
                    print("❌ Mistake missing 'definition' field")
                    print(first_mistake)
                else:
                    print("✅ Mistake has 'definition' field")
                    print(f"   Term: {first_mistake.get('term')} - Def: {first_mistake.get('definition')}")
            
            print("✅ Verification Complete (Frontend navigation logic not tested here)")

if __name__ == "__main__":
    run_verification()
