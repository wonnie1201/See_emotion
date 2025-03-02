import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import * as faceapi from 'face-api.js';
import Image from 'next/image';

const emotionEmojis = {
  happy: "😊",
  neutral: "😌",
  surprised: "😃",
  sad: "😢",
  angry: "😠",
  fearful: "😰",
  disgusted: "🤢",
  contempt: "😒"
};

export default function Home() {
  const [imagePreview, setImagePreview] = useState(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelLoadError, setModelLoadError] = useState(null);
  const [emotionsData, setEmotionsData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [language, setLanguage] = useState('ko'); // 기본 언어를 한국어로 설정
  const [showUploadOptions, setShowUploadOptions] = useState(false);

  const texts = {
    en: {
      title: "AI Face Emotion Analysis",
      subtitle: "Upload your photo to analyze facial emotions",
      uploadButton: "Upload Photo",
      analyzing: "Analyzing...",
      positiveEmotion: "Positive Emotions",
      negativeEmotion: "Negative Emotions",
      ageGender: "Age & Gender",
      age: "Age",
      gender: "Gender",
      male: "Male",
      female: "Female",
      happy: "Happy",
      neutral: "Neutral",
      surprised: "Surprised",
      sad: "Sad",
      angry: "Angry",
      fearful: "Fearful",
      disgusted: "Disgusted",
      contempt: "Contempt",
      positiveAnalysis1: "- The corners of the mouth are naturally raised, and fine wrinkles around the eyes are observed.",
      positiveAnalysis2: "- Facial muscles are gently relaxed, indicating a comfortable state.",
      positiveAnalysis3: "- Bright energy is detected in the overall expression.",
      negativeAnalysis1: "- Slight fatigue is detected in the slightly drooping eye corners.",
      negativeAnalysis2: "- Some worry or stress is observed in the fine wrinkles on the forehead.",
      negativeAnalysis3: "- Unstable emotions are read from the tension around the lips.",
      uploadTitle: "Upload Photo",
      fromGallery: "From Gallery",
      takePhoto: "Take Photo",
      selectFile: "Select File",
      dragDropText: "Drag and drop your photo here",
      maleIcon: "Male Face",
      femaleIcon: "Female Face",
      resultTitle: "Analysis Results",
      facePosition: "Female face on the right"
    },
    ko: {
      title: "AI 얼굴 감정 분석",
      subtitle: "사진을 업로드하여 얼굴 감정을 분석해보세요",
      uploadButton: "사진 업로드",
      analyzing: "분석 중...",
      positiveEmotion: "긍정적 감정",
      negativeEmotion: "부정적 감정",
      ageGender: "나이 및 성별",
      age: "나이",
      gender: "성별",
      male: "남성",
      female: "여성",
      happy: "행복",
      neutral: "평온",
      surprised: "즐거움",
      sad: "슬픔",
      angry: "분노",
      fearful: "불안",
      disgusted: "혐오",
      contempt: "경멸",
      positiveAnalysis1: "- 입꼬리가 자연스럽게 올라가 있고, 눈가에 잔잔한 주름이 관찰됩니다.",
      positiveAnalysis2: "- 얼굴 근육이 부드럽게 이완되어 있어 편안한 상태를 나타냅니다.",
      positiveAnalysis3: "- 전반적인 표정에서 밝은 에너지가 감지됩니다.",
      negativeAnalysis1: "- 미세하게 처진 눈꼬리에서 약간의 피로감이 감지됩니다.",
      negativeAnalysis2: "- 이마의 미세한 주름에서 약간의 걱정이나 스트레스가 관찰됩니다.",
      negativeAnalysis3: "- 입술 주변의 긴장감에서 불안정한 감정이 읽힙니다.",
      uploadTitle: "사진 업로드",
      fromGallery: "사진보관함",
      takePhoto: "사진 찍기",
      selectFile: "파일 선택",
      dragDropText: "여기에 사진을 끌어다 놓으세요",
      maleIcon: "남성 얼굴",
      femaleIcon: "여성 얼굴",
      resultTitle: "분석 결과",
      facePosition: "오른쪽 여성 얼굴"
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsModelLoading(true);
        setModelLoadError(null);
        
        // 더 빠른 CDN 사용
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        
        // 캐시 확인
        const modelLoadedDate = localStorage.getItem('modelLoadedDate');
        const today = new Date().toDateString();
        
        // 캐시 확인 로직 수정 - 모델이 실제로 로드되었는지 확인
        if (modelLoadedDate === today) {
          console.log('캐시된 날짜 발견, 모델 상태 확인 중...');
          
          // 모델이 실제로 로드되었는지 확인
          const isSsdLoaded = faceapi.nets.ssdMobilenetv1.isLoaded;
          const isLandmarkLoaded = faceapi.nets.faceLandmark68Net.isLoaded;
          const isExpressionLoaded = faceapi.nets.faceExpressionNet.isLoaded;
          const isAgeGenderLoaded = faceapi.nets.ageGenderNet.isLoaded;
          
          if (isSsdLoaded && isLandmarkLoaded && isExpressionLoaded && isAgeGenderLoaded) {
            console.log('모든 모델이 이미 로드되어 있습니다.');
            setIsModelLoading(false);
            return;
          } else {
            console.log('캐시는 있지만 모델이 로드되지 않았습니다. 다시 로드합니다.');
          }
        }
        
        // 모델 로드
        console.log('모델 로드 시작...');
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
        ]);
        
        // 캐시 저장
        localStorage.setItem('modelLoadedDate', today);
        
        console.log('모델 로드 성공!');
        setIsModelLoading(false);
      } catch (error) {
        console.error('모델 로드 에러:', error);
        setModelLoadError(error.message);
        setIsModelLoading(false);
      }
    };

    loadModels();
  }, []);

  // 로딩 중이거나 에러 상태 표시
  if (isModelLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (modelLoadError) {
    return (
      <div className={styles.errorContainer}>
        <p>😅 모델을 불러오는데 실패했습니다</p>
        <p>{modelLoadError}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  const detectFace = async (imageElement) => {
    try {
      const detections = await faceapi.detectAllFaces(imageElement)
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();
      
      console.log('감지된 얼굴:', detections.length);
      return {
        success: detections.length > 0,
        detections: detections
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return {
        success: false,
        detections: []
      };
    }
  };

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = async () => {
          setIsAnalyzing(true); // 분석 시작
          // 얼굴 감지 및 감정 분석 수행
          const result = await detectFace(img);
          setFaceDetected(result.success);
          
          if (result.success) {
            setImagePreview(e.target.result);
            setEmotionsData(result.detections.map(detection => ({
              expressions: detection.expressions,
              gender: detection.gender,
              landmarks: detection.landmarks
            })));
          } else {
            setImagePreview(e.target.result);
          }
          setIsAnalyzing(false); // 분석 완료
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  const handleDeleteImage = () => {
    setImagePreview(null);
    setFaceDetected(true);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>{texts[language].title}</title>
        <meta name="description" content="이미지 기반 감정 분석 웹앱" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1>{texts[language].title}</h1>
        <p>{texts[language].description}</p>
        
        <div className={styles.languageSelector}>
          <button 
            className={`${styles.languageButton} ${language === 'en' ? styles.active : ''}`}
            onClick={() => handleLanguageChange('en')}
          >
            English
          </button>
          <button 
            className={`${styles.languageButton} ${language === 'ko' ? styles.active : ''}`}
            onClick={() => handleLanguageChange('ko')}
          >
            한국어
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.uploadSection}>
          <div className={styles.uploadSection}>
            <button 
              className={styles.addButton}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <span>+</span>
            </button>
            
            <div 
              className={styles.dropArea}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <p className={styles.dropText}>여기에 사진을 끌어다 놓으세요</p>
            </div>
            
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
        </section>

        {!faceDetected && imagePreview && (
          <div className={styles.warningMessage}>
            <p>{texts[language].noFace}</p>
            <p>{texts[language].uploadHint}</p>
            <button 
              className={styles.retryButton}
              onClick={handleDeleteImage}
            >
              {texts[language].retry}
            </button>
          </div>
        )}

        {faceDetected && imagePreview && (
          <section className={styles.resultSection}>
            {isAnalyzing ? (
              <div className={styles.analyzingContainer}>
                <div className={styles.spinner}></div>
                <p>{texts[language].loading}</p>
              </div>
            ) : emotionsData.length > 0 && (
              <>
                <h2>{texts[language].analysisResult} ({emotionsData.length}명 감지됨)</h2>
                
                {emotionsData.map((faceData, index) => {
                  // 얼굴의 x좌표 값을 기준으로 정렬하여 왼쪽/오른쪽 결정
                  const position = faceData.landmarks.positions[0].x < window.innerWidth / 2 ? '왼쪽' : '오른쪽';
                  const gender = faceData.gender === 'male' ? '남성' : '여성';
                  
                  return (
                    <div key={index} className={styles.faceResult}>
                      <h3>{position} {gender} 얼굴</h3>
                      
                      <div className={styles.emotionCategory}>
                        <h3>{texts[language].positiveEmotion}</h3>
                        <div className={styles.emotionItem}>
                          <span className={styles.emotionLabel}>{texts[language].happy} {emotionEmojis.happy}</span>
                          <div className={styles.emotionBar}>
                            <div
                              className={styles.bar}
                              style={{ 
                                width: `${(faceData.expressions.happy * 100).toFixed(0)}%`,
                                backgroundColor: '#4CAF50'
                              }}
                            />
                            <span className={styles.percentage}>
                              {(faceData.expressions.happy * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className={styles.emotionItem}>
                          <span className={styles.emotionLabel}>{texts[language].neutral} {emotionEmojis.neutral}</span>
                          <div className={styles.emotionBar}>
                            <div
                              className={styles.bar}
                              style={{ 
                                width: `${(faceData.expressions.neutral * 100).toFixed(0)}%`,
                                backgroundColor: '#66BB6A'
                              }}
                            />
                            <span className={styles.percentage}>
                              {(faceData.expressions.neutral * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className={styles.emotionItem}>
                          <span className={styles.emotionLabel}>{texts[language].surprised} {emotionEmojis.surprised}</span>
                          <div className={styles.emotionBar}>
                            <div
                              className={styles.bar}
                              style={{ 
                                width: `${(faceData.expressions.surprised * 100).toFixed(0)}%`,
                                backgroundColor: '#81C784'
                              }}
                            />
                            <span className={styles.percentage}>
                              {(faceData.expressions.surprised * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className={styles.analysisText}>
                          <p>{texts[language].positiveAnalysis1}</p>
                          <p>{texts[language].positiveAnalysis2}</p>
                          <p>{texts[language].positiveAnalysis3}</p>
                        </div>
                      </div>

                      <div className={styles.emotionCategory}>
                        <h3>{texts[language].negativeEmotion}</h3>
                        <div className={styles.emotionItem}>
                          <span className={styles.emotionLabel}>{texts[language].sad} {emotionEmojis.sad}</span>
                          <div className={styles.emotionBar}>
                            <div
                              className={styles.bar}
                              style={{ 
                                width: `${(faceData.expressions.sad * 100).toFixed(0)}%`,
                                backgroundColor: '#5C6BC0'
                              }}
                            />
                            <span className={styles.percentage}>
                              {(faceData.expressions.sad * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className={styles.emotionItem}>
                          <span className={styles.emotionLabel}>{texts[language].angry} {emotionEmojis.angry}</span>
                          <div className={styles.emotionBar}>
                            <div
                              className={styles.bar}
                              style={{ 
                                width: `${(faceData.expressions.angry * 100).toFixed(0)}%`,
                                backgroundColor: '#7986CB'
                              }}
                            />
                            <span className={styles.percentage}>
                              {(faceData.expressions.angry * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className={styles.emotionItem}>
                          <span className={styles.emotionLabel}>{texts[language].fearful} {emotionEmojis.fearful}</span>
                          <div className={styles.emotionBar}>
                            <div
                              className={styles.bar}
                              style={{ 
                                width: `${(faceData.expressions.fearful * 100).toFixed(0)}%`,
                                backgroundColor: '#9575CD'
                              }}
                            />
                            <span className={styles.percentage}>
                              {(faceData.expressions.fearful * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className={styles.analysisText}>
                          <p>{texts[language].negativeAnalysis1}</p>
                          <p>{texts[language].negativeAnalysis2}</p>
                          <p>{texts[language].negativeAnalysis3}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
