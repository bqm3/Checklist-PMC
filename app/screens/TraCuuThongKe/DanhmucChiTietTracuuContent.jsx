import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableHighlight,
  TouchableWithoutFeedback,
  BackHandler
} from "react-native";
import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Feather } from "@expo/vector-icons";
import { DataTable } from "react-native-paper";
import { COLORS, SIZES, marginBottomValue } from "../../constants/theme";
import axios from "axios";
import { BASE_URL } from "../../constants/config";
import moment from "moment";
import ModalTracuu from "../../components/Modal/ModalTracuu";
import DanhmucThongKe from "./DanhmucThongKe";

const numberOfItemsPerPageList = [20, 30, 50];

const headerList = [
  {
    til: "Ngày kiểm tra",
    width: 120,
  },
  {
    til: "Checklist",
    width: 200,
  },
  // {
  //   til: "Tên tòa nhà",
  //   width: 150,
  // },
  {
    til: "Thuộc tầng",
    width: 150,
  },
  {
    til: "Thuộc khu vực",
    width: 150,
  },
  {
    til: "Thuộc bộ phận",
    width: 150,
  },
  {
    til: "Ca đầu",
    width: 150,
  },

  {
    til: "Nhân viên",
    width: 150,
  },
  {
    til: "Kết quả",
    width: 100,
  },
];

const DanhmucTracuuContent = ({ setOpacity, opacity }) => {
  const dispath = useDispatch();
  const { ent_tang, ent_khuvuc, ent_toanha } = useSelector(
    (state) => state.entReducer
  );
  const { authToken } = useSelector((state) => state.authReducer);

  const [dataTraCuu, setDataTraCuu] = useState([]);
  const [dataKhuvuc, setDataKhuvuc] = useState([]);
  const [newActionCheckList, setNewActionCheckList] = useState([]);

  const bottomSheetModalRef = useRef(null);
  const bottomSheetModalRef2 = useRef(null);
  const snapPoints = useMemo(() => ["90%"], []);
  const snapPoints2 = useMemo(() => ["90%"], []);
  // const [opacity, setOpacity] = useState(1);
  const [page, setPage] = React.useState(0);
  const [numberOfItemsPerPage, onItemsPerPageChange] = React.useState(
    numberOfItemsPerPageList[0]
  );

  const [isLoading, setIsLoading] = useState(false);

  const [isEnabled, setIsEnabled] = useState(true);
  const [countPage, setCoutPage] = useState();
  const [modalVisible, setModalVisible] = useState(false);

  const date = new Date();
  const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
  const endOfMonth = moment(date).format("YYYY-MM-DD");
  const [isShowChecklist, setIsShowChecklist] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState({
    fromDate: false,
    toDate: false,
  });

  const [filters, setFilters] = useState({
    fromDate: startOfMonth,
    toDate: endOfMonth,
    ID_Toanha: null,
    ID_Khuvuc: null,
    ID_Tang: null,
  });

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  useEffect(() => {
    setDataKhuvuc(ent_khuvuc);
  }, [ent_khuvuc]);

  const asyncKhuvuc = async () => {
    let data = {
      ID_Toanha: filters.ID_Toanha,
    };
    await axios
      .post(BASE_URL + `/ent_khuvuc/filter`, data, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + authToken,
        },
      })

      .then((res) => {
        setDataKhuvuc(res.data.data);
      })
      .catch((error) => console.log("err", error.response.data.message));
  };

  useEffect(() => {
    asyncKhuvuc();
  }, [filters.ID_Toanha]);

  const toggleTodo = async (item) => {
    // setIsCheckbox(true);
    const isExistIndex = newActionCheckList.findIndex(
      (existingItem) =>
        existingItem.ID_Checklistchitiet === item.ID_Checklistchitiet
    );

    // Nếu item đã tồn tại, xóa item đó đi
    if (isExistIndex !== -1) {
      setNewActionCheckList((prevArray) =>
        prevArray.filter((_, index) => index !== isExistIndex)
      );
    } else {
      // Nếu item chưa tồn tại, thêm vào mảng mới
      setNewActionCheckList([item]);
      const filter =
        item.Ketqua == item?.ent_checklist?.Giatridinhdanh &&
        item?.Ghichu == "" &&
        (item?.Anh == "" || item?.Anh === null)
          ? false
          : true;
      setIsShowChecklist(filter);
    }
  };

  const toggleDatePicker = (key, isCheck) => {
    setDatePickerVisibility((data) => ({
      ...data,
      [key]: isCheck,
    }));
  };

  const handleChangeFilters = (key, value) => {
    setFilters((data) => ({
      ...data,
      [key]: value,
    }));
    setIsEnabled(false);
  };

  const fetchData = async (filter) => {
    setIsLoading(true);
    await axios
      .post(
        BASE_URL +
          `/tb_checklistchitiet/filters?page=${page}&limit=${numberOfItemsPerPage}`,
        filter,
        {
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + authToken,
          },
        }
      )
      .then((res) => {
        setDataTraCuu(res?.data?.data);
        handlePresentModalClose();
        setIsLoading(false);
        setCoutPage(res.data.totalPages);
      })
      .catch((error) => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData(filters);
  }, [page, numberOfItemsPerPage]);

  const toggleSwitch = (isEnabled) => {
    setIsEnabled(!isEnabled);
    if (isEnabled === false) {
      setFilters({
        fromDate: startOfMonth,
        toDate: endOfMonth,
        ID_Toanha: null,
        ID_Khuvuc: null,
        ID_Tang: null,
      });
    }
  };

  // const handleSheetChanges = useCallback((index) => {
  //   if (index === -1) {
  //     setOpacity(1);
  //   } else {
  //     setOpacity(0.2);
  //   }
  // }, []);
  const handleSheetChanges = useCallback((index) => {
    setOpacity(index === -1 ? 1 : 0.2);
    setIsBottomSheetOpen(index !== -1);
  }, []);

  // const handlePresentModalPress = useCallback(() => {
  //   bottomSheetModalRef?.current?.present();
  // }, []);

  // const handlePresentModalClose = useCallback(() => {
  //   setOpacity(1);
  //   bottomSheetModalRef?.current?.close();
  // });
  const handlePresentModalPress = useCallback(() => {
    setOpacity(0.2);
    setIsBottomSheetOpen(true);
    bottomSheetModalRef?.current?.present();
  }, []);

  const handlePresentModalClose = useCallback(() => {
    setOpacity(1);
    setIsBottomSheetOpen(false);
    bottomSheetModalRef?.current?.close();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (isBottomSheetOpen) {
        handlePresentModalClose();
        return true;
      }
      return false;
    };
  
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
  
    return () => backHandler.remove();
  }, [isBottomSheetOpen]);

  const decimalNumber = (number) => {
    if (number < 10 && number > 0) return `0${number}`;
    if (number === 0) return `0`;
    return number;
  };

  const handleModalShow = (active, op) => {
    setModalVisible(active);
    setOpacity(Number(op));
  };

  React.useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage]);

  const _renderItem = ({ item, index }) => {
    const isExistIndex = newActionCheckList?.find(
      (existingItem) =>
        existingItem?.ID_Checklistchitiet === item?.ID_Checklistchitiet
    );

    return (
      <TouchableHighlight key={index} onPress={() => toggleTodo(item)}>
        <DataTable.Row
          style={{
            gap: 20,
            paddingVertical: 10,
            backgroundColor: isExistIndex ? COLORS.bg_button : "white",
          }}
        >
          <DataTable.Cell style={{ width: 120, justifyContent: "center" }}>
            <Text
              allowFontScaling={false}
              style={{ color: isExistIndex ? "white" : "black" }}
              numberOfLines={2}
            >
              {moment(item?.tb_checklistc?.Ngay).format("DD-MM-YYYY")}
            </Text>
          </DataTable.Cell>
          <DataTable.Cell style={{ width: 200, justifyContent: "center" }}>
            <Text
              allowFontScaling={false}
              style={{ color: isExistIndex ? "white" : "black" }}
              numberOfLines={3}
            >
              {item?.ent_checklist?.Checklist}
            </Text>
          </DataTable.Cell>
          {/* <DataTable.Cell style={{ width: 150, justifyContent: "center" }}>
              <Text allowFontScaling={false}
                style={{ color: isExistIndex ? "white" : "black" }}
                numberOfLines={2}
              >
                {item?.ent_checklist?.ent_hangmuc?.ent_khuvuc?.ent_toanha?.Toanha}
              </Text>
            </DataTable.Cell> */}
          <DataTable.Cell style={{ width: 150, justifyContent: "center" }}>
            <Text
              allowFontScaling={false}
              style={{ color: isExistIndex ? "white" : "black" }}
              numberOfLines={2}
            >
              {item?.ent_checklist?.ent_tang?.Tentang}
            </Text>
          </DataTable.Cell>
          <DataTable.Cell style={{ width: 150, justifyContent: "center" }}>
            <Text
              allowFontScaling={false}
              style={{ color: isExistIndex ? "white" : "black" }}
              numberOfLines={2}
            >
              {item?.ent_checklist?.ent_khuvuc?.Tenkhuvuc}
            </Text>
          </DataTable.Cell>
          <DataTable.Cell style={{ width: 150, justifyContent: "center" }}>
            <Text
              allowFontScaling={false}
              style={{ color: isExistIndex ? "white" : "black" }}
              numberOfLines={2}
            >
              {" "}
              {item?.tb_checklistc?.ent_khoicv?.KhoiCV}
            </Text>
          </DataTable.Cell>
          <DataTable.Cell style={{ width: 150, justifyContent: "center" }}>
            <Text
              allowFontScaling={false}
              style={{ color: isExistIndex ? "white" : "black" }}
              numberOfLines={2}
            >
              {item?.tb_checklistc?.ent_calv?.Tenca}
            </Text>
          </DataTable.Cell>
          <DataTable.Cell style={{ width: 150, justifyContent: "center" }}>
            <Text
              allowFontScaling={false}
              style={{ color: isExistIndex ? "white" : "black" }}
              numberOfLines={2}
            >
              {item?.tb_checklistc?.ent_user?.Hoten}
            </Text>
          </DataTable.Cell>

          <DataTable.Cell style={{ width: 100, justifyContent: "center" }}>
            <Text
              allowFontScaling={false}
              style={{ color: isExistIndex ? "white" : "black" }}
              numberOfLines={2}
            >
              {item?.Ketqua}
            </Text>
          </DataTable.Cell>
        </DataTable.Row>
      </TouchableHighlight>
    );
  };

  
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={{ flex: 1 }}
      >
        <BottomSheetModalProvider>
          {/* <ImageBackground
              source={require("../../../assets/bg.png")}
              resizeMode="cover"
              style={{ flex: 1 }}
            > */}
          {/* <ScrollView
            style={{
              flex: 1,
              opacity: opacity,
            }}
          > */}
          {/* <ScrollView> */}
          {/* Tra cứu  */}
          <View style={[styles.container, { opacity: opacity }]}>
            {isLoading === true ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 40,
                }}
              >
                <ActivityIndicator size="large" color={"white"} />
              </View>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 20,
                  }}
                >
                  <TouchableWithoutFeedback
                    onPress={() => handlePresentModalClose()}
                  >
                    <View>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 18,
                          color: "white",
                          fontWeight: "600",
                        }}
                      >
                        Số lượng: {decimalNumber(dataTraCuu?.length)}
                      </Text>
                    </View>
                  </TouchableWithoutFeedback>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={handlePresentModalPress}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Image
                        source={require("../../../assets/icons/filter_icon.png")}
                        resizeMode="contain"
                        style={{ height: 24, width: 24 }}
                      />
                      <Text allowFontScaling={false} style={styles.text}>
                        Lọc dữ liệu
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {dataTraCuu && dataTraCuu?.length > 0 ? (
                  <>
                    {/* <ScrollView
                          style={{ flex: 1, marginBottom: 20, marginTop: 20 }
                          }
                        > */}
                    <DataTable
                      style={{
                        backgroundColor: "white",
                        borderRadius: 8,
                        marginBottom: marginBottomValue,
                      }}
                    >
                      <ScrollView
                        horizontal
                        contentContainerStyle={{
                          flexDirection: "column",
                        }}
                      >
                        <DataTable.Header
                          style={{
                            backgroundColor: "#eeeeee",
                            borderTopRightRadius: 8,
                            borderTopLeftRadius: 8,
                          }}
                        >
                          {headerList &&
                            headerList.map((item, index) => {
                              return (
                                <DataTable.Title
                                  key={index}
                                  style={{
                                    width: item?.width,
                                    borderRightWidth:
                                      index === headerList.length - 1 ? 0 : 2,
                                    borderRightColor: "white",
                                    justifyContent: "center",
                                  }}
                                  numberOfLines={2}
                                >
                                  <Text
                                    allowFontScaling={false}
                                    style={[styles.text, { color: "black" }]}
                                  >
                                    {item?.til}
                                  </Text>
                                </DataTable.Title>
                              );
                            })}
                        </DataTable.Header>

                        {dataTraCuu && dataTraCuu?.length > 0 && (
                          <FlatList
                            keyExtractor={(item, index) =>
                              `${item?.ID_ChecklistC}_${index}`
                            }
                            scrollEnabled={true}
                            data={dataTraCuu}
                            renderItem={_renderItem}
                          />
                        )}
                        <DataTable.Pagination
                          style={{
                            justifyContent: "flex-start",
                            backgroundColor: "#eeeeee",
                          }}
                          page={page}
                          numberOfPages={Math.ceil(countPage)}
                          onPageChange={(page) => {
                            setPage(page);
                            // fetchData()
                          }}
                          label={`Từ ${page + 1} đến ${countPage}`}
                          showFastPaginationControls
                          numberOfItemsPerPageList={numberOfItemsPerPageList}
                          numberOfItemsPerPage={numberOfItemsPerPage}
                          onItemsPerPageChange={onItemsPerPageChange}
                          selectPageDropdownLabel={"Hàng trên mỗi trang"}
                        />
                      </ScrollView>
                    </DataTable>
                    {/* </ScrollView> */}
                  </>
                ) : (
                  <>
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 120,
                      }}
                    >
                      <Image
                        source={require("../../../assets/icons/delete_bg.png")}
                        resizeMode="contain"
                        style={{ height: 120, width: 120 }}
                      />
                      <Text
                        allowFontScaling={false}
                        style={[styles.danhmuc, { paddingVertical: 10 }]}
                      >
                        Không có dữ liệu cần tìm
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
          {/* </ScrollView> */}

          {/* Bottom sheet modal tra cuu  */}
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
          >
            <BottomSheetScrollView style={styles.contentContainer}>
              <ModalTracuu
                handleChangeFilters={handleChangeFilters}
                filters={filters}
                toggleDatePicker={toggleDatePicker}
                isDatePickerVisible={isDatePickerVisible}
                ent_toanha={ent_toanha}
                ent_tang={ent_tang}
                ent_khuvuc={ent_khuvuc}
                setIsEnabled={setIsEnabled}
                toggleSwitch={toggleSwitch}
                isEnabled={isEnabled}
                dataKhuvuc={dataKhuvuc}
                fetchData={fetchData}
                handlePresentModalClose={handlePresentModalClose}
              />
            </BottomSheetScrollView>
          </BottomSheetModal>

          {/* Bottom sheet modal thong ke  */}
          <BottomSheetModal
            ref={bottomSheetModalRef2}
            index={0}
            snapPoints={snapPoints2}
            onChange={handleSheetChanges}
          >
            <BottomSheetScrollView style={styles.contentContainer}>
              <ModalTracuu
                handleChangeFilters={handleChangeFilters}
                filters={filters}
                toggleDatePicker={toggleDatePicker}
                isDatePickerVisible={isDatePickerVisible}
                ent_toanha={ent_toanha}
                ent_tang={ent_tang}
                ent_khuvuc={ent_khuvuc}
                setIsEnabled={setIsEnabled}
                toggleSwitch={toggleSwitch}
                isEnabled={isEnabled}
                dataKhuvuc={dataKhuvuc}
                fetchData={fetchData}
                handlePresentModalClose={handlePresentModalClose}
              />
            </BottomSheetScrollView>
          </BottomSheetModal>
          <View
            style={{
              width: 60,
              position: "absolute",
              right: 20,
              bottom: 50,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
            }}
          >
            {newActionCheckList?.length > 0 &&
              isShowChecklist &&
              (newActionCheckList[0]?.Anh !== null &&
              newActionCheckList[0]?.Anh !== "" ? (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleModalShow(true, 0.2)}
                >
                  <Feather name="image" size={26} color="white" />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleModalShow(true, 0.2)}
                  >
                    <Feather name="eye" size={26} color="white" />
                  </TouchableOpacity>
                </>
              ))}
          </View>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(!modalVisible);
            }}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text allowFontScaling={false} style={styles.modalText}>
                  Thông tin Checklist
                </Text>

                <ScrollView>
                  {newActionCheckList[0]?.Anh !== null &&
                    newActionCheckList[0]?.Anh !== "" && (
                      <Image
                        style={{
                          width: SIZES.width * 0.8,
                          height: SIZES.height * 0.5,
                          objectFit: "cover",
                        }}
                        source={{
                          uri: `https://drive.google.com/thumbnail?id=${newActionCheckList[0]?.Anh}`,
                        }}
                      />
                    )}

                  <View
                    style={{
                      flexDirection: "column",
                      marginVertical: 15,
                      gap: 4,
                    }}
                  >
                    <Text allowFontScaling={false} style={styles.textModal}>
                      Tầng:{" "}
                      {newActionCheckList[0]?.ent_checklist?.ent_tang?.Tentang}
                    </Text>
                    <Text allowFontScaling={false} style={styles.textModal}>
                      Khu vực:{" "}
                      {
                        newActionCheckList[0]?.ent_checklist?.ent_khuvuc
                          ?.Tenkhuvuc
                      }
                    </Text>
                    <Text allowFontScaling={false} style={styles.textModal}>
                      Tòa nhà:{" "}
                      {
                        newActionCheckList[0]?.ent_checklist?.ent_khuvuc
                          ?.ent_toanha?.Toanha
                      }
                    </Text>
                    <Text allowFontScaling={false} style={styles.textModal}>
                      Khối công việc:{" "}
                      {newActionCheckList[0]?.tb_checklistc?.ent_khoicv?.KhoiCV}
                    </Text>
                    <Text allowFontScaling={false} style={styles.textModal}>
                      Người checklist:{" "}
                      {newActionCheckList[0]?.tb_checklistc?.ent_user?.Hoten}
                    </Text>

                    <Text allowFontScaling={false} style={styles.textModal}>
                      Ca làm việc:{" "}
                      {newActionCheckList[0]?.tb_checklistc?.ent_calv?.Tenca} (
                      {
                        newActionCheckList[0]?.tb_checklistc?.ent_calv
                          ?.Giobatdau
                      }{" "}
                      -{" "}
                      {
                        newActionCheckList[0]?.tb_checklistc?.ent_calv
                          ?.Gioketthuc
                      }
                      )
                    </Text>
                    <Text allowFontScaling={false} style={styles.textModal}>
                      Giờ checklist: {newActionCheckList[0]?.Gioht}
                    </Text>
                    <Text allowFontScaling={false} style={styles.textModal}>
                      Kết quả: {newActionCheckList[0]?.Ketqua}{" "}
                      {newActionCheckList[0]?.ent_checklist?.isCheck == 0
                        ? ""
                        : `${newActionCheckList[0]?.ent_checklist?.Giatrinhan}`}
                    </Text>
                    <Text allowFontScaling={false} style={styles.textModal}>
                      Ghi chú: {newActionCheckList[0]?.Ghichu}
                    </Text>
                  </View>
                </ScrollView>
              </View>
              <TouchableOpacity
                onPress={() => handleModalShow(false, 1)}
                style={styles.buttonImage}
              >
                <Text allowFontScaling={false} style={styles.textImage}>
                  Đóng
                </Text>
              </TouchableOpacity>
            </View>
          </Modal>
          {/* </ImageBackground> */}
        </BottomSheetModalProvider>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};

export default DanhmucTracuuContent;

const styles = StyleSheet.create({
  container: {
    margin: 12,
    flex: 1,
  },
  danhmuc: {
    fontSize: 25,
    fontWeight: "700",
    color: "white",
  },
  text: { fontSize: 15, color: "white", fontWeight: "600" },
  textModal: { fontSize: 15, color: "black", fontWeight: "600" },
  button: {
    backgroundColor: COLORS.color_bg,
    width: 65,
    height: 65,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonImage: {
    flexDirection: "row",
    backgroundColor: COLORS.bg_button,
    alignContent: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginTop: 10,
  },
  textImage: {
    padding: 12,
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    zIndex: 10,
  },

  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    // alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    height: SIZES.height * 0.7,
    width: SIZES.width * 0.85,
  },
  modalText: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 10,
  },
});
