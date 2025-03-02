import { useState, useEffect, useRef } from 'react';
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
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceData, setFaceData] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [language, setLanguage] = useState('ko');
  const [errorMessage, setErrorMessage] = useState('');
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  
  const imageRef = useRef(null);

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
      maleIcon: "남성 얼굴",
      femaleIcon: "여성 얼굴",
      resultTitle: "분석 결과",
      facePosition: "오른쪽 여성 얼굴"
    }
  };

  const loadModels = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      console.log('모델 로딩 시작...');
      
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
      ]);
      
      console.log('모든 모델 로드 완료');
      setModelsLoaded(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('모델 로딩 오류:', error);
      setErrorMessage(`모델을 로드하는 중 오류가 발생했습니다: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };

  useEffect(() => {
    if (typeof faceapi === 'undefined') {
      console.error('face-api.js not loaded');
      setErrorMessage('필수 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해 주세요.');
      return;
    }
    
    loadModels();
    
    return () => {
      setFaceData(null);
      setImageSrc(null);
    };
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.includes('image/')) {
      setErrorMessage('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('5MB 이하의 이미지만 업로드 가능합니다.');
      return;
    }
    
    setFaceData(null);
    setErrorMessage('');
    setIsAnalyzing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      console.log('이미지 로드 완료, 분석 시작');
      
      if (modelsLoaded) {
        analyzeImage(e.target.result);
      } else {
        loadModels().then(() => analyzeImage(e.target.result));
      }
    };
    
    reader.onerror = () => {
      setErrorMessage('이미지를 읽는 중 오류가 발생했습니다.');
      setIsAnalyzing(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      if (!file.type.includes('image/')) {
        setErrorMessage('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        setFaceData(null);
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imgSrc) => {
    const sourceToUse = imgSrc || imageSrc;
    
    if (!sourceToUse) {
      console.error('분석할 이미지가 없습니다.');
      setErrorMessage('분석할 이미지가 없습니다.');
      setIsAnalyzing(false);
      return;
    }
    
    try {
      if (!modelsLoaded) {
        await loadModels();
      }
      
      console.log('얼굴 분석 시작...');
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error('이미지 로드 실패'));
        img.src = sourceToUse;
      });
      
      const loadedImg = await imageLoadPromise;
      console.log(`이미지 크기: ${loadedImg.width}x${loadedImg.height}`);
      
      let processImg = loadedImg;
      const MAX_SIZE = 800;
      
      if (loadedImg.width > MAX_SIZE || loadedImg.height > MAX_SIZE) {
        console.log('이미지 크기 조정 중...');
        const canvas = document.createElement('canvas');
        let width = loadedImg.width;
        let height = loadedImg.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(loadedImg, 0, 0, width, height);
        processImg = canvas;
      }
      
      const options = {
        inputSize: 224,
        scoreThreshold: 0.5
      };
      
      console.log('얼굴 감지 실행 중...');
      const detections = await faceapi.detectAllFaces(processImg, new faceapi.SsdMobilenetv1Options(options))
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();
      
      console.log('감지 결과:', detections);
      
      if (detections && detections.length > 0) {
        console.log('얼굴 감지 성공!');
        setFaceData(detections[0]);
        setIsAnalyzing(false);
      } else {
        console.log('얼굴을 감지할 수 없습니다.');
        setErrorMessage('얼굴을 감지할 수 없습니다. 다른 사진을 시도해 주세요.');
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('얼굴 분석 중 오류:', error);
      setErrorMessage(`분석 중 오류가 발생했습니다: ${error.message}`);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (imageSrc && modelsLoaded && !isAnalyzing) {
      analyzeImage();
    }
  }, [imageSrc, modelsLoaded]);

  const handleDeleteImage = () => {
    setImageSrc(null);
    setFaceData(null);
    setErrorMessage('');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
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
        <p>{texts[language].subtitle}</p>
        
        <div className={styles.languageSelector}>
          <button 
            className={`${styles.languageButton} ${language === 'en' ? styles.active : ''}`}
            onClick={toggleLanguage}
          >
            English
          </button>
          <button 
            className={`${styles.languageButton} ${language === 'ko' ? styles.active : ''}`}
            onClick={toggleLanguage}
          >
            한국어
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {errorMessage && (
          <div className={styles.errorMessage}>
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage('')}>×</button>
          </div>
        )}
        
        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>모델을 로딩 중입니다...</p>
          </div>
        )}
        
        {!isLoading && !imageSrc && (
          <div className={styles.uploadSection}>
            <div className={styles.uploadContainer}>
              {!showUploadOptions ? (
                <button 
                  className={styles.addButton}
                  onClick={() => setShowUploadOptions(true)}
                >
                  <span>+</span>
                </button>
              ) : (
                <div className={styles.uploadOptions}>
                  <button 
                    className={styles.uploadOption} 
                    onClick={() => {
                      document.getElementById('fileInput').click();
                      setShowUploadOptions(false);
                    }}
                  >
                    <div className={styles.optionIcon}>
                      <Image src="/gallery-icon.png" alt="Gallery" width={40} height={40} />
                    </div>
                    <span>사진보관함</span>
                  </button>
                  
                  <button 
                    className={styles.uploadOption}
                    onClick={() => setShowUploadOptions(false)}
                  >
                    <div className={styles.optionIcon}>
                      <Image src="/camera-icon.png" alt="Camera" width={40} height={40} />
                    </div>
                    <span>사진 찍기</span>
                  </button>
                  
                  <label 
                    className={styles.uploadOption} 
                    htmlFor="fileInput"
                    onClick={() => setTimeout(() => setShowUploadOptions(false), 100)}
                  >
                    <div className={styles.optionIcon}>
                      <Image src="/upload-icon.png" alt="Upload" width={40} height={40} />
                    </div>
                    <span>파일 선택</span>
                    <input
                      id="fileInput"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  <button 
                    className={styles.closeButton}
                    onClick={() => setShowUploadOptions(false)}
                  >
                    <span>×</span>
                  </button>
                </div>
              )}
            </div>
            
            <div 
              className={styles.dropArea}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <p className={styles.dropText}>여기에 사진을 끌어다 놓으세요</p>
            </div>
          </div>
        )}
        
        {imageSrc && (
          <div className={styles.imageContainer}>
            <img 
              ref={imageRef}
              id="uploadedImage"
              src={imageSrc} 
              alt="Uploaded" 
              className={styles.uploadedImage}
              crossOrigin="anonymous"
            />
            
            <button 
              className={styles.deleteButton}
              onClick={handleDeleteImage}
            >
              ×
            </button>
            
            {isAnalyzing && (
              <div className={styles.analyzingOverlay}>
                <div className={styles.loadingSpinner}></div>
                <p>{texts[language].analyzing}</p>
              </div>
            )}
          </div>
        )}
        
        {faceData && (
          <div className={styles.resultSection}>
            <h2>{texts[language].resultTitle}</h2>
            <p className={styles.faceDescription}>{texts[language].facePosition}</p>
            
            <div className={styles.genderIcons}>
              <div className={styles.genderIcon}>
                <Image src="/female-face.png" alt={texts[language].femaleIcon} width={50} height={50} />
                <span>{texts[language].femaleIcon}</span>
              </div>
              <div className={styles.genderIcon}>
                <Image src="/male-face.png" alt={texts[language].maleIcon} width={50} height={50} />
                <span>{texts[language].maleIcon}</span>
              </div>
            </div>
            
            <div className={styles.ageGenderSection}>
              <h3>{texts[language].ageGender}</h3>
              <div className={styles.ageGenderInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{texts[language].age}</span>
                  <span className={styles.infoValue}>{Math.round(faceData.age)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{texts[language].gender}</span>
                  <span className={styles.infoValue}>
                    {faceData.gender === 'male' ? texts[language].male : texts[language].female}
                  </span>
                </div>
              </div>
            </div>
            
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
        )}
      </main>
    </div>
  );
}
