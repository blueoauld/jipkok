import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Image } from "expo-image";
import { router } from "expo-router";
import { HeartIcon, SirenIcon } from "phosphor-react-native";
import { FlatList } from "react-native";
import { Avatar, getTokens, Text, useTheme, XStack, YStack } from "tamagui";

const CARD_RATIO = 2.5;

const OVERLAY_TEXT_SHADOW = {
  textShadowColor: "rgba(0, 0, 0, 0.45)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
} as const;

type Post = {
  id: string;
  /** 게시물 id와 별개로 작성자 프로필로 이동할 때 쓴다 */
  authorId: string;
  nickname: string;
  time: string;
  caption?: string;
  photo: string;
  avatar: string;
};

const POSTS: Post[] = [
  { id: "0", time: "15:00" },
  { id: "1", time: "14:00", caption: "미팅" },
  { id: "2", time: "13:00", caption: "회의에서 얻은 커피" },
  { id: "3", time: "12:00", caption: "인생 한방 노리기" },
  { id: "4", time: "11:00", caption: "인터뷰하러 강남" },
].map((post) => ({
  ...post,
  authorId: post.id,
  nickname: `닉네임 ${post.id}`,
  photo: `https://picsum.photos/seed/feed-${post.id}/1000/400`,
  avatar: `https://picsum.photos/seed/user-${post.id}/100`,
}));

function FeedCard({ post }: { post: Post }) {
  return (
    <YStack
      width="100%"
      aspectRatio={CARD_RATIO}
      rounded="$7"
      overflow="hidden"
    >
      <Image source={post.photo} contentFit="cover" style={{ flex: 1 }} />

      <XStack
        position="absolute"
        t="$3"
        l="$3"
        items="center"
        gap="$2"
        pressStyle={{ opacity: 0.6 }}
        onPress={() => router.push(`/member/${post.authorId}`)}
      >
        <Avatar circular size="$3">
          <Avatar.Image src={post.avatar} />
          <Avatar.Fallback theme="gray" bg="$color5"></Avatar.Fallback>
        </Avatar>

        <Text
          numberOfLines={1}
          maxW="60%"
          color="white"
          fontSize="$3"
          fontWeight="600"
          style={OVERLAY_TEXT_SHADOW}
        >
          {post.nickname}
        </Text>
      </XStack>

      <YStack position="absolute" b="$2" r="$2" items="center">
        <XStack p="$2" pressStyle={{ opacity: 0.6 }}>
          <SirenIcon size={28} weight="fill" color="white" />
        </XStack>

        <XStack p="$2" pressStyle={{ opacity: 0.6 }}>
          <HeartIcon size={28} weight="bold" color="white" />
        </XStack>
      </YStack>

      <YStack fullscreen items="center" justify="center" px="$4">
        <Text
          color="white"
          fontSize="$9"
          fontWeight="800"
          style={OVERLAY_TEXT_SHADOW}
        >
          {post.time}
        </Text>

        {post.caption && (
          <Text
            numberOfLines={1}
            color="white"
            fontSize="$5"
            fontWeight="600"
            style={OVERLAY_TEXT_SHADOW}
          >
            {post.caption}
          </Text>
        )}
      </YStack>
    </YStack>
  );
}

function TodayButton() {
  const theme = useTheme();
  const hasGlass = isLiquidGlassAvailable();

  return (
    <GlassView
      glassEffectStyle="regular"
      style={{
        borderRadius: 9999,
        overflow: "hidden",
        backgroundColor: hasGlass ? undefined : theme.gray4.val,
      }}
    >
      <XStack px="$4" py="$2" pressStyle={{ opacity: 0.7 }}>
        <Text fontSize="$4">오늘</Text>
      </XStack>
    </GlassView>
  );
}

export default function FeedScreen() {
  const space = getTokens().space;

  return (
    <YStack flex={1}>
      <FlatList
        data={POSTS}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <FeedCard post={item} />}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          padding: space.$4.val,
          gap: space.$2.val,
        }}
      />

      <XStack position="absolute" b="$4" l={0} r={0} justify="center">
        <TodayButton />
      </XStack>
    </YStack>
  );
}
