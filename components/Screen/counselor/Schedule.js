import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  ScrollView,
  Linking,
  TextInput,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import {
  Agenda,
  AgendaList,
  CalendarProvider,
  ExpandableCalendar,
} from "react-native-calendars";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axiosJWT, { BASE_URL } from "../../../config/Config";
import { useFocusEffect } from "@react-navigation/native";

export default function Schedule() {
  const { width, height } = Dimensions.get("screen");
  // const [items, setItems] = useState({});
  const [items, setItems] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [openInfo, setOpenInfo] = useState(false);
  const [info, setInfo] = useState({});
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openAttendance, setOpenAttendance] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [method, setMethod] = useState("");
  const [value, setValue] = useState("");
  const statusOptions = ["CANCELED", "ABSENT", "ATTEND"];

  useEffect(() => {
    console.log(items);
  }, [items]);

  useFocusEffect(
    React.useCallback(() => {
      // const startDate = new Date(selectedDate);
      // const endDate = new Date(startDate);
      // endDate.setDate(startDate.getDate() + 6);
      // startDate.setDate(startDate.getDate() - 6);

      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();

      const startDate = new Date(
        date.getTime() - dayOfWeek * 24 * 60 * 60 * 1000
      );
      const endDate = new Date(
        date.getTime() + (6 - dayOfWeek) * 24 * 60 * 60 * 1000
      );

      const fromDate = startDate.toISOString().split("T")[0];
      const toDate = endDate.toISOString().split("T")[0];
      if (fromDate && toDate) {
        fetchData(fromDate, toDate);
      }
    }, [selectedDate])
  );

  const formatDate = (value) => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  };

  const openURL = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred", err)
    );
  };

  const fetchData = async (fromDate, toDate) => {
    try {
      if (!fromDate || !toDate) return;
      console.log(fromDate, "|", toDate);

      const scheduleRes = await axiosJWT.get(
        `${BASE_URL}/booking-counseling/appointment?fromDate=${fromDate}&toDate=${toDate}`
      );

      const data = scheduleRes?.data;
      console.log(data);
      if (data.status === 200) {
        const formattedItems = data?.content?.reduce((acc, appointment) => {
          const date = appointment?.startDateTime.split("T")[0];
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push({
            id: appointment?.id,
            date: formatDate(date),
            startTime: appointment?.startDateTime.split("T")[1].slice(0, 5),
            endTime: appointment?.endDateTime.split("T")[1].slice(0, 5),
            meetingType: appointment?.meetingType,
            place:
              appointment?.meetingType === "ONLINE"
                ? `${appointment?.meetUrl}`
                : `${appointment?.address}`,
            studentName: appointment?.studentInfo?.fullName || "No name",
            studentImage: appointment?.studentInfo?.avatarLink || "Image-url",
            status: appointment?.status,
            feedback: appointment?.appointmentFeedback,
          });
          return acc;
        }, {});

        const items = Object.keys(formattedItems).map((date) => ({
          title: date,
          data: formattedItems[date],
        }));

        setItems(items);

        const marked = {};
        items.forEach((item) => {
          marked[item.title] = {
            marked: true,
            dotColor: selectedDate === item.title ? "white" : "#F39300",
          };
        });
        setMarkedDates(marked);
      } else {
        Alert.alert("Error", "Failed to fetch data");
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const error = console.error;
  console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
  };

  const handleOpenInfo = (info) => {
    setInfo(info);
    setOpenInfo(true);
  };

  const handleOpenUpdateAppointment = async (id, method, value) => {
    setOpenUpdate(true);
    setSelectedAppointment(id);
    setMethod(method);
    setValue(value);
  };

  const handleOpenTakeAttendance = async (id, value) => {
    setOpenAttendance(true);
    setSelectedAppointment(id);
    setValue(value);
  };

  const handleUpdateAppointment = async () => {
    try {
      const dataToSend =
        method === "ONLINE" ? { meetUrl: value } : { address: value };
      const response = await axiosJWT.put(
        `${BASE_URL}/booking-counseling/${selectedAppointment}/update-details`,
        dataToSend
      );
      const data = await response.data;
      if (data && data.status == 200) {
        setInfo({
          ...info,
          place: value,
        });
        handleCloseUpdateAppointment();
      } else {
        Alert.alert("Appointment", "Failed to Update Appointment");
      }
      // console.log(selectedAppointment, method.toLowerCase(), value);
    } catch (error) {
      console.error("Something error", error);
    }
  };

  const handleTakeAttendance = async () => {
    try {
      const response = await axiosJWT.put(
        `${BASE_URL}/booking-counseling/take-attendance/${selectedAppointment}/${value}`
      );
      const data = await response.data;
      if (data && data.status == 200) {
        handleCloseTakeAttendance();
      }
    } catch {
      console.error("Something error", error);
    }
  };

  const handleCloseUpdateAppointment = () => {
    setValue("");
    setSelectedAppointment(null);
    setOpenUpdate(false);
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();

    const startDate = new Date(
      date.getTime() - dayOfWeek * 24 * 60 * 60 * 1000
    );
    const endDate = new Date(
      date.getTime() + (6 - dayOfWeek) * 24 * 60 * 60 * 1000
    );

    const fromDate = startDate.toISOString().split("T")[0];
    const toDate = endDate.toISOString().split("T")[0];
    if (fromDate && toDate) {
      fetchData(fromDate, toDate);
    }
  };

  const handleCloseTakeAttendance = () => {
    setSelectedAppointment(null);
    setValue(null);
    setOpenAttendance(false);
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();

    const startDate = new Date(
      date.getTime() - dayOfWeek * 24 * 60 * 60 * 1000
    );
    const endDate = new Date(
      date.getTime() + (6 - dayOfWeek) * 24 * 60 * 60 * 1000
    );

    const fromDate = startDate.toISOString().split("T")[0];
    const toDate = endDate.toISOString().split("T")[0];
    if (fromDate && toDate) {
      fetchData(fromDate, toDate);
    }
  };

  const handleCloseInfo = () => {
    setInfo("");
    setOpenInfo(false);
  };

  const renderItem = ({ item }) => (
    <>
      <TouchableOpacity
        onPress={() => handleOpenInfo(item)}
        activeOpacity={0.8}
        style={{
          backgroundColor: "white",
          padding: 16,
          borderRadius: 10,
          margin: 8,
          elevation: 3,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Image
            source={{ uri: item.studentImage }}
            style={{
              width: width * 0.14,
              height: width * 0.14,
              borderRadius: width * 0.07,
              marginRight: 16,
              borderWidth: 1.5,
              borderColor: "#F39300",
            }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "black",
              }}
            >
              {item.studentName}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: "#555",
                marginTop: 4,
              }}
            >
              {item.startTime} - {item.endTime}
            </Text>
          </View>
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
            }}
          >
            <TouchableOpacity
              onPress={() => handleOpenTakeAttendance(item.id, item.status)}
              disabled={new Date().toISOString().split("T")[0] > item.date}
              activeOpacity={0.6}
              style={{
                backgroundColor: "#fdfdfd",
                borderRadius: 20,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: "#F39300",
                paddingHorizontal: 12,
                flexDirection: "row",
                elevation: 1,
              }}
            >
              <MaterialIcons name="edit-calendar" size={20} color="#F39300" />
              <Text style={{ fontSize: 16, marginHorizontal: 6 }}>-</Text>
              <Text
                style={[
                  { fontSize: 16, fontWeight: "bold" },
                  item.status === "ATTEND" && { color: "green" },
                  item.status === "WAITING" && { color: "#F39300" },
                  item.status === "ABSENT" && { color: "red" },
                  item.status === "CANCELED" && { color: "gray" },
                ]}
              >
                {item.status}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );

  // const handleMonthChange = (newDate) => {
  //   const startOfWeek = new Date(newDate.dateString);
  //   const endOfWeek = new Date(startOfWeek);
  //   endOfWeek.setDate(startOfWeek.getDate() + 31);
  //   startOfWeek.setDate(startOfWeek.getDate() - 31);

  //   const fromDate = startOfWeek.toISOString().split("T")[0];
  //   const toDate = endOfWeek.toISOString().split("T")[0];

  //   fetchData(fromDate, toDate);
  // };

  return (
    <>
      <View style={{ backgroundColor: "#f5f7fd", flex: 1 }}>
        <View style={{ flex: 1, marginTop: 30 }}>
          <CalendarProvider
            date={selectedDate}
            onDateChanged={(date) => setSelectedDate(date)}
          >
            <ExpandableCalendar
              firstDay={0}
              markedDates={markedDates}
              hideKnob
              disablePan
              initialPosition="close"
              theme={{
                selectedDayBackgroundColor: "#F39300",
                selectedDayTextColor: "white",
                // selectedDayBackgroundColor: "white",
                // selectedDayTextColor: "black",
                arrowColor: "#F39300",
                textDayHeaderFontSize: 14,
                textDayFontSize: 16,
                todayTextColor: "#F39300",
              }}
              style={{
                elevation: 1,
              }}
              renderArrow={(direction) => {
                return direction === "left" ? (
                  <Ionicons name="chevron-back" size={22} color="#F39300" />
                ) : (
                  <Ionicons name="chevron-forward" size={22} color="#F39300" />
                );
              }}
            />
            <AgendaList
              sections={items}
              renderItem={renderItem}
              style={{ marginTop: 8 }}
              sectionStyle={{
                color: "#F39300",
                backgroundColor: "#f5f7fd",
                fontSize: 16,
                marginHorizontal: 10,
                paddingTop: 12,
                paddingBottom: 4,
              }}
            />
          </CalendarProvider>
          <Modal
            transparent={true}
            visible={openAttendance}
            animationType="slide"
            onRequestClose={handleCloseTakeAttendance}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            >
              <View
                style={{
                  width: width * 0.85,
                  padding: 20,
                  backgroundColor: "white",
                  borderRadius: 10,
                  elevation: 10,
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "#ededed",
                    padding: 4,
                    marginBottom: 8,
                    borderRadius: 20,
                    alignSelf: "flex-end",
                    alignItems: "flex-end",
                  }}
                  onPress={handleCloseTakeAttendance}
                >
                  <Ionicons name="close" size={28} />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    marginBottom: 10,
                    textAlign: "center",
                  }}
                >
                  Take Attendance
                </Text>
                <FlatList
                  data={statusOptions}
                  keyExtractor={(item) => item}
                  numColumns={2}
                  columnWrapperStyle={{ justifyContent: "space-between" }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => setValue(item)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginVertical: 4,
                      }}
                    >
                      <Ionicons
                        name={
                          item === value
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={20}
                        color={item === value ? "#F39300" : "gray"}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          fontSize: 18,
                          color: item == value ? "#F39300" : "black",
                          fontWeight: item == "value" ? "600" : "0",
                        }}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  onPress={handleTakeAttendance}
                  style={{
                    marginTop: 20,
                    backgroundColor: "#F39300",
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            transparent={true}
            visible={openInfo}
            animationType="slide"
            onRequestClose={handleCloseInfo}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.2)",
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: "98%",
                  backgroundColor: "#f5f7fd",
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "#ededed",
                    padding: 4,
                    marginHorizontal: 20,
                    marginTop: 16,
                    marginBottom: 8,
                    borderRadius: 20,
                    alignSelf: "flex-start",
                    alignItems: "flex-start",
                  }}
                  onPress={handleCloseInfo}
                >
                  <Ionicons name="chevron-back" size={28} />
                </TouchableOpacity>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{ alignItems: "center" }}>
                    <Image
                      source={{ uri: info.studentImage }}
                      style={{
                        width: width * 0.32,
                        height: width * 0.32,
                        borderRadius: 100,
                        marginBottom: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        marginBottom: 30,
                      }}
                    >
                      {info.studentName}
                    </Text>
                  </View>
                  <View
                    style={{
                      marginHorizontal: 20,
                      borderRadius: 20,
                      backgroundColor: "white",
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderWidth: 1.5,
                      borderColor: "lightgrey",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginVertical: 12,
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Ionicons name="calendar" size={24} color="#F39300" />
                        <Text
                          style={{
                            fontSize: 18,
                            color: "gray",
                            fontWeight: "500",
                            marginLeft: 10,
                          }}
                        >
                          Date
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            fontSize: 18,
                            color: "black",
                            fontWeight: "500",
                          }}
                        >
                          {info.date}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderColor: "lightgrey",
                        marginVertical: 4,
                      }}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginVertical: 12,
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Ionicons name="time" size={24} color="#F39300" />
                        <Text
                          style={{
                            fontSize: 18,
                            color: "gray",
                            fontWeight: "500",
                            marginLeft: 10,
                          }}
                        >
                          Time
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={{
                            fontSize: 18,
                            color: "black",
                            fontWeight: "500",
                          }}
                        >
                          {info.startTime} - {info.endTime}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderColor: "lightgrey",
                        marginVertical: 4,
                      }}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginVertical: 12,
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <MaterialIcons
                          name="meeting-room"
                          size={24}
                          color="#F39300"
                        />
                        <Text
                          style={{
                            fontSize: 18,
                            color: "gray",
                            fontWeight: "500",
                            marginLeft: 10,
                          }}
                        >
                          Format
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: "#F39300",
                          borderRadius: 18,
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: "white",
                          }}
                        >
                          {info.meetingType}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderColor: "lightgrey",
                        marginVertical: 4,
                      }}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginVertical: 12,
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        {info.meetingType === "ONLINE" && (
                          <Ionicons name="videocam" size={24} color="#F39300" />
                        )}
                        {info.meetingType === "OFFLINE" && (
                          <MaterialIcons
                            name="place"
                            size={24}
                            color="#F39300"
                          />
                        )}

                        <Text
                          style={{
                            fontSize: 18,
                            color: "gray",
                            fontWeight: "500",
                            marginLeft: 10,
                          }}
                        >
                          {info.meetingType === "ONLINE"
                            ? "Meet URL"
                            : "Address"}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", maxWidth: "50%" }}>
                        {info.date + "T" + info.startTime >
                          new Date().toISOString() && (
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "flex-end",
                              marginHorizontal: 8,
                            }}
                          >
                            <TouchableOpacity
                              onPress={() =>
                                handleOpenUpdateAppointment(
                                  info.id,
                                  info.meetingType,
                                  info.place
                                )
                              }
                            >
                              <Ionicons
                                name="pencil"
                                size={24}
                                color="#F39300"
                              />
                            </TouchableOpacity>
                            <Modal
                              transparent={true}
                              visible={openUpdate}
                              animationType="fade"
                              onRequestClose={handleCloseUpdateAppointment}
                            >
                              <View
                                style={{
                                  flex: 1,
                                  justifyContent: "center",
                                  alignItems: "center",
                                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                                }}
                              >
                                <View
                                  style={{
                                    width: width * 0.8,
                                    padding: 20,
                                    backgroundColor: "white",
                                    borderRadius: 10,
                                    elevation: 10,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 22,
                                      fontWeight: "bold",
                                      marginBottom: 10,
                                      textAlign: "center",
                                    }}
                                  >
                                    Update Confirmation
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 18,
                                      marginBottom: 30,
                                      textAlign: "left",
                                    }}
                                  >
                                    Are you sure you want to update this
                                    appointment? Your schedule will be updated
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 16,
                                      marginBottom: 10,
                                      fontWeight: "600",
                                    }}
                                  >
                                    Please provide the meeting
                                    {info.meetingType === "ONLINE"
                                      ? "'s Google Meet URL"
                                      : "'s address"}{" "}
                                    <Text
                                      style={{ color: "#F39300", fontSize: 20 }}
                                    >
                                      *
                                    </Text>
                                  </Text>
                                  <View>
                                    <TextInput
                                      placeholder="Input here"
                                      placeholderTextColor="gray"
                                      keyboardType="default"
                                      value={value}
                                      onChangeText={(value) => setValue(value)}
                                      style={{
                                        fontWeight: "600",
                                        fontSize: 16,
                                        opacity: 0.8,
                                        paddingVertical: 8,
                                        textAlignVertical: "center",
                                        paddingHorizontal: 12,
                                        backgroundColor: "#ededed",
                                        borderColor: "gray",
                                        borderWidth: 1,
                                        borderRadius: 10,
                                        marginBottom: 20,
                                      }}
                                    />
                                  </View>
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <TouchableOpacity
                                      style={{
                                        flex: 1,
                                        backgroundColor: "#ededed",
                                        padding: 10,
                                        borderRadius: 10,
                                        marginRight: 10,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        borderWidth: 1,
                                        borderColor: "gray",
                                      }}
                                      onPress={handleCloseUpdateAppointment}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 18,
                                          color: "black",
                                          fontWeight: "600",
                                        }}
                                      >
                                        No
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={{
                                        flex: 1,
                                        backgroundColor: "#F39300",
                                        padding: 10,
                                        borderRadius: 10,
                                        justifyContent: "center",
                                        alignItems: "center",
                                      }}
                                      onPress={handleUpdateAppointment}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 18,
                                          color: "white",
                                          fontWeight: "600",
                                        }}
                                      >
                                        Yes
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>
                            </Modal>
                          </View>
                        )}
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: "black",
                          }}
                        >
                          {info.place}
                        </Text>
                        {/* {info.meetingType === "ONLINE" && (
                          <Ionicons
                            name="open"
                            size={20}
                            style={{
                              color: "grey",
                              marginLeft: 8,
                              marginTop: 2,
                            }}
                            onPress={() => {
                              openURL(`https://meet.google.com/${info.place}`);
                            }}
                          />
                        )} */}
                      </View>
                    </View>
                  </View>
                  {info?.feedback !== null ? (
                    <View
                    style={{
                      margin: 20,
                      borderRadius: 20,
                      backgroundColor: "white",
                      padding: 16,
                      borderWidth: 1.5,
                      borderColor: "#E0E0E0",
                      elevation: 5,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      >
                        {formatDate(info?.feedback?.createdAt)}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#F39300",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 16,
                        }}
                      >
                        <Ionicons name="star" size={16} color="white" />
                        <Text
                          style={{
                            fontSize: 16,
                            marginLeft: 6,
                            fontWeight: "bold",
                            color: "white",
                          }}
                        >
                          {info?.feedback?.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: 18,
                        color: "#555",
                        fontWeight: "500",
                        lineHeight: 24,
                      }}
                    >
                      {info?.feedback?.comment}
                    </Text>
                  </View>
                  ) : (
                    <View
                      style={{
                        margin: 20,
                        borderRadius: 20,
                        backgroundColor: "white",
                        padding: 16,
                        borderWidth: 1.5,
                        borderColor: "lightgrey",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          color: "black",
                          fontWeight: "500",
                        }}
                      >
                        There's no feedback yet
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </>
  );
}

{
  /* <Agenda
            items={items}
            selected={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            renderItem={(item) => {
              return (
                <TouchableOpacity
                  style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: 16,
                    marginRight: 16,
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: "#F39300",
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "400",
                        color: "black",
                      }}
                    >
                      {item.time}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#F39300",
                        borderRadius: 20,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        marginLeft: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          color: "white",
                        }}
                      >
                        {item.meetingType}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      marginTop: 8,
                      color: "black",
                      fontWeight: "500",
                    }}
                  >
                    {item.place}
                  </Text>
                  <View
                    style={{
                      justifyContent: "flex-end",
                      flexDirection: "row",
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "black",
                        verticalAlign: "middle",
                        opacity: 0.7,
                        marginRight: 20,
                      }}
                    >
                      {item.studentName}
                    </Text>
                    <Image
                      source={{ uri: item.studentImage }}
                      style={{
                        width: width * 0.08,
                        height: height * 0.048,      
                        borderRadius: 40,
                      }}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
            renderEmptyData={() => {
              return (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20,
                  }}
                >
                  <Text
                    style={{ fontSize: 24, fontWeight: "600", opacity: 0.6 }}
                  >
                    No Schedule
                  </Text>
                </View>
              );
            }}
            rowHasChanged={(r1, r2) => {
              return r1.name !== r2.name;
            }}
            pastScrollRange={2}
            futureScrollRange={4}
            theme={{
              calendarBackground: "white",
              agendaDayTextColor: "black",
              agendaDayNumColor: "black",
              agendaTodayColor: "#F39300",
              agendaKnobColor: "#e3e3e3",
              monthTextColor: "#F39300",
              dotColor: "#F39300",
              selectedDayBackgroundColor: "#F39300",
              selectedDayTextColor: "white",
              todayTextColor: "#F39300",
            }}
            renderArrow={(direction) => {
              return direction === "left" ? (
                <Ionicons
                  name="caret-back-circle-outline"
                  size={30}
                  color="#F39300"
                />
              ) : (
                <Ionicons
                  name="caret-forward-circle-outline"
                  size={30}
                  color="#F39300"
                />
              );
            }}
          /> */
}
