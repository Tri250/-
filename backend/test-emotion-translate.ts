import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

let authToken = '';
let testPetId = '';

async function testAuth() {
  console.log('\n=== 测试认证 ===');
  
  const testEmail = `test_${Date.now()}@example.com`;
  
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Test123456',
      name: '测试用户',
    }),
  });
  
  const registerData = await registerRes.json();
  console.log('注册结果:', registerRes.status === 201 ? '✅ 成功' : `❌ 失败 (${registerRes.status})`);
  
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Test123456',
    }),
  });
  
  const loginData = await loginRes.json();
  authToken = loginData.token || '';
  console.log('登录结果:', authToken ? '✅ 成功' : '❌ 失败');
  console.log('Token:', authToken ? '已获取' : '未获取');
  
  return authToken ? true : false;
}

async function testCreatePet() {
  console.log('\n=== 测试创建宠物 ===');
  
  const res = await fetch(`${BASE_URL}/pets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      name: '测试猫猫',
      type: 'CAT',
      breed: '英短',
      gender: 'MALE',
    }),
  });
  
  const data = await res.json();
  testPetId = data.data?.id || '';
  console.log('创建宠物:', data.code === 200 || data.code === 201 ? '✅ 成功' : `❌ 失败 (${data.code})`);
  console.log('宠物ID:', testPetId || '未获取');
  
  return testPetId ? true : false;
}

async function testEmotionTranslate() {
  console.log('\n=== 测试情感翻译 (ET-CORE-002) ===');
  
  const testCases = [
    { input: '我的猫一直蹭我，还翘尾巴', expectedEmotion: 'affectionate', desc: '猫咪撒娇行为' },
    { input: '我的狗对着门口低吼，炸毛', expectedEmotion: 'alert', desc: '狗狗警惕行为' },
    { input: '我的猫一直叫，蜷缩在角落，不让碰', expectedEmotion: 'pain', desc: '猫咪疼痛表现' },
    { input: '我的猫很开心，在地上打滚', expectedEmotion: 'happy', desc: '猫咪开心表现' },
    { input: '我的猫一直喘气', expectedEmotion: 'anxious', desc: '猫咪喘气' },
  ];
  
  for (const tc of testCases) {
    const res = await fetch(`${BASE_URL}/ai/emotion-translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        petId: testPetId,
        sourceType: 'behavior',
        inputContent: tc.input,
      }),
    });
    
    const data = await res.json();
    const hasEmotion = data.data?.emotion === tc.expectedEmotion;
    const hasDisclaimer = data.data?.translation?.includes('免责声明');
    const hasConfidence = typeof data.data?.confidence === 'number';
    
    console.log(`  ${tc.desc}: ${hasEmotion ? '✅' : '❌'} (情绪: ${data.data?.emotion || 'N/A'}, 置信度: ${data.data?.confidence || 'N/A'})`);
    console.log(`    免责声明: ${hasDisclaimer ? '✅' : '❌'}`);
    console.log(`    置信度: ${hasConfidence ? '✅' : '❌'}`);
  }
}

async function testEmotionTranslateHealthAlert() {
  console.log('\n=== 测试健康风险预警 (ET-CORE-004) ===');
  
  const res = await fetch(`${BASE_URL}/ai/emotion-translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      petId: testPetId,
      sourceType: 'behavior',
      inputContent: '我的猫一直叫，蜷缩在角落，不让碰',
    }),
  });
  
  const data = await res.json();
  const hasHealthAlert = data.data?.healthAlert === true;
  const hasAlertMessage = !!data.data?.alertMessage;
  
  console.log(`  健康预警检测: ${hasHealthAlert ? '✅' : '❌'} (${data.data?.healthAlert})`);
  console.log(`  预警信息: ${hasAlertMessage ? '✅' : '❌'}`);
  console.log(`  预警内容: ${data.data?.alertMessage || 'N/A'}`);
}

async function testTranslationHistory() {
  console.log('\n=== 测试翻译历史 (ET-HIST-001) ===');
  
  const res = await fetch(`${BASE_URL}/ai/translation-history/${testPetId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });
  
  const data = await res.json();
  const hasHistory = Array.isArray(data.data) && data.data.length > 0;
  const hasPagination = !!data.pagination;
  
  console.log(`  获取历史: ${hasHistory ? '✅' : '❌'} (${data.data?.length || 0} 条记录)`);
  console.log(`  分页信息: ${hasPagination ? '✅' : '❌'}`);
}

async function testTranslationHistoryEmpty() {
  console.log('\n=== 测试空历史场景 (ET-HIST-004) ===');
  
  const res = await fetch(`${BASE_URL}/pets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      name: '空历史测试宠物',
      type: 'DOG',
      breed: '金毛',
      gender: 'FEMALE',
    }),
  });
  
  const petData = await res.json();
  const newPetId = petData.data?.id;
  
  if (newPetId) {
    const historyRes = await fetch(`${BASE_URL}/ai/translation-history/${newPetId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    const historyData = await historyRes.json();
    const isEmpty = historyData.data?.length === 0;
    const hasMessage = !!historyData.message;
    
    console.log(`  空场景处理: ${isEmpty ? '✅' : '❌'}`);
    console.log(`  引导提示: ${hasMessage ? '✅' : '❌'} (${historyData.message || 'N/A'})`);
  }
}

async function testUnauthorizedAccess() {
  console.log('\n=== 测试未授权访问 (ET-EDGE-002) ===');
  
  const res = await fetch(`${BASE_URL}/ai/emotion-translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      petId: testPetId,
      sourceType: 'behavior',
      inputContent: '测试',
    }),
  });
  
  const data = await res.json();
  const isUnauthorized = res.status === 401;
  
  console.log(`  未授权拦截: ${isUnauthorized ? '✅' : '❌'} (状态码: ${res.status})`);
  console.log(`  错误信息: ${data.error || 'N/A'}`);
}

async function testInvalidInput() {
  console.log('\n=== 测试无效输入 (ET-EDGE-003) ===');
  
  const res = await fetch(`${BASE_URL}/ai/emotion-translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      petId: testPetId,
      sourceType: 'voice',
      inputContent: 'x',
      audioDuration: 1,
    }),
  });
  
  const data = await res.json();
  const isRejected = res.status === 400 && data.error?.includes('2秒');
  
  console.log(`  短音频拦截: ${isRejected ? '✅' : '❌'} (${data.error || 'N/A'})`);
}

async function testGenerateReportWithEmotion() {
  console.log('\n=== 测试生成报告含情感数据 (ET-LINK-004) ===');
  
  const res = await fetch(`${BASE_URL}/ai/generate-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      petId: testPetId,
      period: '30d',
    }),
  });
  
  const data = await res.json();
  const hasReport = !!data.data?.reportId;
  const hasEmotionTrend = !!data.data?.emotionTrend;
  
  console.log(`  报告生成: ${hasReport ? '✅' : '❌'}`);
  console.log(`  情感趋势: ${hasEmotionTrend ? '✅' : '❌'}`);
  console.log(`  主导情绪: ${data.data?.emotionTrend?.dominantEmotion || 'N/A'}`);
  console.log(`  预警次数: ${data.data?.emotionTrend?.alertCount || 0}`);
}

async function testDeleteTranslation() {
  console.log('\n=== 测试删除翻译记录 (ET-HIST-003) ===');
  
  const res = await fetch(`${BASE_URL}/ai/translation-history/${testPetId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });
  
  const data = await res.json();
  if (data.data?.length > 0) {
    const recordId = data.data[0].id;
    
    const deleteRes = await fetch(`${BASE_URL}/ai/translation-history/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    const deleteData = await deleteRes.json();
    console.log(`  删除操作: ${deleteRes.status === 200 ? '✅ 成功' : '❌ 失败'}`);
  } else {
    console.log(`  无记录可删除，跳过`);
  }
}

async function testCrossPetDataIsolation() {
  console.log('\n=== 测试跨宠物数据隔离 (ET-HIST-002) ===');
  
  const res1 = await fetch(`${BASE_URL}/pets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      name: '第二个宠物',
      type: 'DOG',
      breed: '泰迪',
      gender: 'MALE',
    }),
  });
  
  const petData = await res1.json();
  const secondPetId = petData.data?.id;
  
  if (secondPetId) {
    await fetch(`${BASE_URL}/ai/emotion-translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        petId: secondPetId,
        sourceType: 'behavior',
        inputContent: '这是第二个宠物的翻译',
      }),
    });
    
    const historyRes = await fetch(`${BASE_URL}/ai/translation-history/${testPetId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    const historyData = await historyRes.json();
    const allFromFirstPet = historyData.data?.every((r: any) => r.petId === testPetId);
    
    console.log(`  数据隔离: ${allFromFirstPet ? '✅' : '❌'}`);
    console.log(`  记录数: ${historyData.data?.length || 0}`);
  }
}

async function runTests() {
  console.log('========================================');
  console.log('AI情感翻译机模块 - 验收测试');
  console.log('========================================');
  
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('\n❌ 认证失败，终止测试');
    return;
  }
  
  const petSuccess = await testCreatePet();
  if (!petSuccess) {
    console.log('\n❌ 创建宠物失败，终止测试');
    return;
  }
  
  await testEmotionTranslate();
  await testEmotionTranslateHealthAlert();
  await testTranslationHistory();
  await testTranslationHistoryEmpty();
  await testUnauthorizedAccess();
  await testInvalidInput();
  await testGenerateReportWithEmotion();
  await testDeleteTranslation();
  await testCrossPetDataIsolation();
  
  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

runTests().catch(console.error);
