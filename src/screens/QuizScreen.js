import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MathText from '../components/MathText';
import ProgressRail from '../components/ProgressRail';
import ScratchPad from '../components/ScratchPad';
import { useTheme } from '../theme';

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function QuizScreen({ route, navigation }) {
  const { color, type, space, radius } = useTheme();
  const { questionList, label, timeLimitSeconds } = route.params;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => questionList.map(() => null));
  const [remaining, setRemaining] = useState(timeLimitSeconds ?? null);

  // The countdown effect only ever runs once and must not submit a stale
  // answer set, so it reads the latest answers from a ref rather than closing
  // over the `answers` state from whichever render set it up.
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (timeLimitSeconds == null) return undefined;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!submittedRef.current) {
            submittedRef.current = true;
            navigation.replace('Result', {
              questionList,
              answers: answersRef.current,
              label,
            });
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timeLimitSeconds]);

  const question = questionList[index];
  const answer = answers[index];
  const isLast = index === questionList.length - 1;

  const setAnswer = (value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const toggleOption = (optionId) => {
    if (question.question_type === 'multi_select') {
      const current = answer || [];
      setAnswer(
        current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
      );
    } else {
      setAnswer([optionId]);
    }
  };

  const finish = () => {
    submittedRef.current = true;
    navigation.replace('Result', { questionList, answers, label });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingHorizontal: space.md, paddingTop: space.sm }}>
          <ProgressRail
            total={questionList.length}
            current={index}
            answered={answers}
            onJump={setIndex}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: space.sm,
            }}
          >
            <Text style={type.small}>
              Question {index + 1} of {questionList.length}
              {question.question_type === 'multi_select' ? ' · select all that apply' : ''}
              {question.question_type === 'numerical' ? ' · type your answer' : ''}
            </Text>
            {remaining !== null && (
              <Text
                style={[
                  type.small,
                  {
                    fontWeight: '700',
                    fontVariant: ['tabular-nums'],
                    color: remaining <= 30 ? color.wrong : color.ink,
                  },
                ]}
              >
                {formatClock(remaining)}
              </Text>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <MathText
            body={question.body}
            contentType={question.content_type}
            fontSize={17}
            style={{ marginBottom: space.lg }}
          />

          {question.question_type === 'numerical' ? (
            <View>
              <TextInput
                value={answer ?? ''}
                onChangeText={setAnswer}
                keyboardType="numeric"
                placeholder="Your answer"
                placeholderTextColor={color.locked}
                style={{
                  borderWidth: 1,
                  borderColor: color.rule,
                  borderRadius: radius.sm,
                  backgroundColor: color.card,
                  padding: space.md,
                  fontSize: 18,
                  color: color.ink,
                }}
              />
              {question.numerical_answer?.unit ? (
                <Text style={[type.small, { marginTop: space.xs }]}>
                  Answer in {question.numerical_answer.unit}
                </Text>
              ) : null}
            </View>
          ) : (
            question.options.map((option) => {
              const selected = (answer || []).includes(option.id);
              const isMulti = question.question_type === 'multi_select';
              const iconName = selected
                ? isMulti
                  ? 'checkbox'
                  : 'radio-button-on'
                : isMulti
                  ? 'square-outline'
                  : 'radio-button-off';
              return (
                <Pressable
                  key={option.id}
                  onPress={() => toggleOption(option.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    borderWidth: 1,
                    borderColor: selected ? color.accent : color.rule,
                    backgroundColor: selected ? color.accentSoft : color.card,
                    borderRadius: radius.sm,
                    padding: space.md,
                    marginBottom: space.sm,
                  }}
                >
                  <Ionicons
                    name={iconName}
                    size={22}
                    color={selected ? color.accent : color.inkSoft}
                    style={{ marginRight: space.sm, marginTop: 1 }}
                  />
                  <View style={{ flex: 1 }}>
                    <MathText
                      body={option.body}
                      contentType={option.content_type}
                      fontSize={16}
                    />
                  </View>
                </Pressable>
              );
            })
          )}

          <ScratchPad resetKey={index} />
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            gap: space.sm,
            padding: space.md,
            borderTopWidth: 1,
            borderTopColor: color.rule,
          }}
        >
          <Pressable
            disabled={index === 0}
            onPress={() => setIndex((i) => i - 1)}
            style={{
              paddingVertical: space.md,
              paddingHorizontal: space.lg,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: color.rule,
              opacity: index === 0 ? 0.4 : 1,
            }}
          >
            <Text style={{ color: color.ink, fontWeight: '600' }}>Back</Text>
          </Pressable>

          <Pressable
            onPress={() => (isLast ? finish() : setIndex((i) => i + 1))}
            style={{
              flex: 1,
              paddingVertical: space.md,
              borderRadius: radius.sm,
              backgroundColor: color.accent,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: color.paper, fontWeight: '600', fontSize: 16 }}>
              {isLast ? 'Finish and see score' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
