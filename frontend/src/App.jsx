import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Card,
  Image,
  Stack,
  Badge,
  HStack,
  VStack,
  Spinner,
  Separator,
} from "@chakra-ui/react";
import { StarfieldCanvas } from "./StarfieldCanvas";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [skyData, setSkyData] = useState(null);

  const scanSky = () => {
    setLoading(true);
    setErrorMsg(null);

    if (!navigator.geolocation) {
      setErrorMsg("Geolocation API is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const payload = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        try {
          const apiUrl = import.meta.env.VITE_API_URL;

          const response = await fetch(`${apiUrl}/api/sky-view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }

          const data = await response.json();
          setSkyData(data);
        } catch (err) {
          setErrorMsg(err.message || "Failed to retrieve celestial observation data.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setErrorMsg(`Geolocation permission denied: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 50000, maximumAge: 60000 }
    );
  };

  return (
    <Box position="relative" minH="100vh" color="gray.100" overflowX="hidden">
      {/* Animated Twinkling Constellation Canvas */}
      <StarfieldCanvas />

      <Container maxW="6xl" py={12} position="relative" zIndex={1}>
        {/* Hero Section */}
        <VStack gap={6} textAlign="center" mb={10}>
          <Badge
            colorPalette="purple"
            variant="solid"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
            letterSpacing="wider"
          >
            Stargazing Companion
          </Badge>

          <Heading as="h1" size="3xl" fontWeight="black" letterSpacing="tight">
            Know what's above you
          </Heading>

          <Text fontSize="lg" maxW="2xl" color="gray.400">
            Want to know what's in your night sky right now? Grant location access and we’ll point you directly toward the stars visible from your spot.
          </Text>

          <Button
            size="xl"
            colorPalette="cyan"
            variant="solid"
            px={8}
            loading={loading}
            loadingText="Aligning Sky Instruments..."
            onClick={scanSky}
            boxShadow="0 0 25px rgba(6, 182, 212, 0.45)"
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "0 0 35px rgba(6, 182, 212, 0.7)",
            }}
          >
            Locate Constellations Above Me
          </Button>
        </VStack>

        {/* Error notification banner */}
        {errorMsg && (
          <Box
            p={4}
            mb={8}
            borderRadius="md"
            bg="red.950"
            borderWidth="1px"
            borderColor="red.700"
            color="red.200"
          >
            <Text fontWeight="bold">Location Access Error</Text>
            <Text fontSize="sm">{errorMsg}</Text>
          </Box>
        )}

        {/* Celestial Results */}
        {skyData && (
          <VStack gap={8} align="stretch">
            {/* Observer Telemetry Header */}
            <Card.Root
              bg="rgba(255, 255, 255, 0.05)"
              backdropFilter="blur(16px)"
              borderColor="whiteAlpha.200"
              borderWidth="1px"
              borderRadius="xl"
            >
              <Card.Body p={6}>
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} textAlign="center">
                  <Box>
                    <Text fontSize="xs" color="gray.400" textTransform="uppercase">
                      Observer Coordinates
                    </Text>
                    <Text fontWeight="bold" fontSize="md" mt={1}>
                      {skyData.location.latitude.toFixed(4)}°, {skyData.location.longitude.toFixed(4)}°
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.400" textTransform="uppercase">
                      Local Timezone
                    </Text>
                    <Text fontWeight="bold" fontSize="md" mt={1}>
                      {skyData.location.timezone}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.400" textTransform="uppercase">
                      Visible Targets
                    </Text>
                    <Text fontWeight="bold" fontSize="md" color="cyan.300" mt={1}>
                      {skyData.visibleConstellations?.length || 0} Above Horizon
                    </Text>
                  </Box>
                </SimpleGrid>
              </Card.Body>
            </Card.Root>

            {/* Gemini Guide Narrative */}
            {skyData.geminiGuide && (
              <Card.Root
                bg="#1a0b2e"
                borderColor="purple.700"
                borderWidth="1px"
                borderRadius="xl"
              >
                <Card.Body p={6}>
                  <HStack mb={3}>
                    <Badge colorPalette="cyan" variant="subtle">Gemini Sky Guide</Badge>
                  </HStack>
                  <Text whiteSpace="pre-line" color="gray.200" lineHeight="tall" fontSize="sm">
                    {skyData.geminiGuide}
                  </Text>
                </Card.Body>
              </Card.Root>
            )}

            <Heading size="xl" pt={4}>
              Visible Constellations
            </Heading>

            {/* Constellation Cards Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              {skyData.visibleConstellations?.map((item) => (
                <Card.Root
                  key={item.name}
                  bg="gray.950"
                  borderColor="gray.800"
                  borderWidth="1px"
                  borderRadius="xl"
                  overflow="hidden"
                  transition="all 0.2s ease"
                  _hover={{
                    borderColor: "cyan.500",
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    height="190px"
                    width="100%"
                    objectFit="cover"
                    fallback={
                      <Box height="190px" bg="gray.900" display="flex" alignItems="center" justifyContent="center">
                        <Spinner color="cyan.400" />
                      </Box>
                    }
                  />

                  <Card.Body p={5}>
                    <Stack gap={3}>
                      <HStack justify="space-between" align="center">
                        <Heading size="md" color="white">
                          {item.name}
                        </Heading>
                        <Badge colorPalette="teal" variant="surface">
                          {item.direction}
                        </Badge>
                      </HStack>

                      <Text fontSize="xs" color="gray.400">
                        Primary Anchor:{" "}
                        <Text as="span" color="white" fontWeight="semibold">
                          {item.anchorStar}
                        </Text>
                      </Text>

                      <HStack gap={6} pt={1}>
                        <Box>
                          <Text fontSize="11px" color="gray.400" textTransform="uppercase">
                            Altitude
                          </Text>
                          <Text fontWeight="bold" color="cyan.200">
                            {item.altitude}°
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="11px" color="gray.400" textTransform="uppercase">
                            Azimuth
                          </Text>
                          <Text fontWeight="bold" color="cyan.200">
                            {item.azimuth}°
                          </Text>
                        </Box>
                      </HStack>

                      <Separator borderColor="gray.800" my={2} />

                      <Text fontSize="11px" color="gray.500">
                        Source: {item.imageSource}
                      </Text>
                    </Stack>
                  </Card.Body>
                </Card.Root>
              ))}
            </SimpleGrid>
          </VStack>
        )}
      </Container>
    </Box>
  );
}