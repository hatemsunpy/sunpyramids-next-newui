"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/client-api";
import { withLocale } from "@/lib/locales";
import type { ApiPage, Locale } from "@/types/api";
import { homeCopy } from "@/lib/home-copy";
import { VoiceFindTripPanel, type FindTripValues } from "@/components/voice/VoiceFindTripPanel";
import { SearchSelectDropdown } from "@/components/SearchSelectDropdown";
import { FlowbiteDatepicker } from "@/components/FlowbiteDatepicker";

const emptyRootCategories: ApiPage[] = [];

type SearchMode = "make" | "find" | "car";
type LocationOption = { id?: number; name?: string };
type ApiListResponse<T> = { data?: T[] | { data?: T[] } };

function listData<T>(response: ApiListResponse<T>): T[] {
  if (Array.isArray(response.data)) return response.data;
  return Array.isArray(response.data?.data) ? response.data.data : [];
}



export function HomeSearchShortcuts({ locale = "en", destinations, rootCategories = emptyRootCategories, modeOnly }: { locale?: Locale; destinations: ApiPage[]; rootCategories?: ApiPage[]; modeOnly?: SearchMode }) {
  const router = useRouter();
  const copy = homeCopy(locale);
  const [mode, setMode] = useState<SearchMode>(modeOnly ?? "make");
  const [makeType, setMakeType] = useState("existTime");
  const [carType, setCarType] = useState("oneWay");
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [dropLocations, setDropLocations] = useState<LocationOption[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationsFailed, setLocationsFailed] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const todayISO = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [findValues, setFindValues] = useState<FindTripValues>({ destination: "", duration: "", category: "" });
  const applyVoiceValues = useCallback((changes: Partial<FindTripValues>) => {
    setFindValues((current) => ({ ...current, ...changes }));
  }, []);
  const reviewedCategory = rootCategories.some((category) => category.slug === findValues.category) ? findValues.category : "";

  useEffect(() => {
    if (mode !== "car") return;
    apiGet<ApiListResponse<LocationOption>>("locations?page_limit=200&order_by=id,asc", locale, false)
      .then((response) => {
        setLocations(listData(response));
        setLocationsFailed(false);
      })
      .catch(() => setLocationsFailed(true));
  }, [locale, mode]);

  async function loadDropLocations(pickupId: string) {
    if (!pickupId) return;
    setLoadingLocations(true);
    setLocationsFailed(false);
    try {
      const response = await apiPost<{ data?: LocationOption[] }>("car/rental/available/destinations", { pickup_location_id: Number(pickupId) }, locale);
      setDropLocations(Array.isArray(response.data) ? response.data : []);
    } catch {
      setLocationsFailed(true);
    } finally {
      setLoadingLocations(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (mode === "find") {
      const params = new URLSearchParams({ days: String(form.get("duration") || ""), destination: String(form.get("place") || "") });
      if (reviewedCategory) params.set("main", reviewedCategory);
      router.push(withLocale(`/trips?${params.toString()}`, locale));
      return;
    }
    if (mode === "car") {
      const params = new URLSearchParams({ type: carType, picupDate: String(form.get("pickupDate") || ""), location: String(form.get("location") || ""), dropLoaction: String(form.get("dropLocation") || "") });
      if (carType === "roundTrip") params.set("returnDate", String(form.get("returnDate") || ""));
      router.push(`${withLocale("/rent-car", locale)}?${params.toString()}`);
      return;
    }
    const params = new URLSearchParams({ type: makeType });
    if (makeType === "existTime") {
      params.set("from", String(form.get("fromDate") || fromDate || ""));
      params.set("to", String(form.get("toDate") || toDate || ""));
    } else if (makeType === "approximateTime") {
      params.set("month", String(form.get("month") || ""));
    } else {
      params.set("days", String(form.get("days") || ""));
    }
    router.push(`${withLocale("/make-your-trip", locale)}?${params.toString()}`);
  }

  return (
    <form className="home-search-panel" onSubmit={submit}>
      {!modeOnly ? (
        <div className="home-search-tabs" role="tablist" aria-label={copy.makeYourTrip}>
          {([["make", copy.makeYourTrip], ["find", copy.findTripShort], ["car", copy.rentCarShort]] as const).map(([value, label]) => (
            <button className={mode === value ? "is-active" : ""} key={value} onClick={() => {
              if (mode === "find" && value !== "find") setFindValues({ destination: "", duration: "", category: "" });
              setMode(value);
            }} role="tab" aria-selected={mode === value} type="button">{label}</button>
          ))}
        </div>
      ) : null}
      {mode === "make" ? (
        <div className="home-search-fields home-search-make-fields">
          <fieldset aria-label={copy.whenTravelling} role="radiogroup"><span className="home-search-question">{copy.whenTravelling}</span><label><input checked={makeType === "existTime"} name="makeType" onChange={() => setMakeType("existTime")} type="radio" /> {copy.exactTime}</label><label><input checked={makeType === "approximateTime"} name="makeType" onChange={() => setMakeType("approximateTime")} type="radio" /> {copy.approximateTime}</label><label><input checked={makeType === "notSureYet"} name="makeType" onChange={() => setMakeType("notSureYet")} type="radio" /> {copy.notSureYet}</label></fieldset>
          {makeType === "existTime" ? (
            <>
              <div className="home-search-field-col">
                <span>{copy.from}</span>
                <FlowbiteDatepicker
                  id="home-make-from-date"
                  name="fromDate"
                  placeholder={copy.selectStartDate}
                  required
                  value={fromDate}
                  minDate={todayISO}
                  onChange={(val) => {
                    setFromDate(val);
                    if (toDate && val && toDate < val) {
                      setToDate("");
                    }
                  }}
                />
              </div>
              <div className="home-search-field-col">
                <span>{copy.to}</span>
                <FlowbiteDatepicker
                  id="home-make-to-date"
                  name="toDate"
                  placeholder={copy.selectEndDate}
                  required
                  value={toDate}
                  minDate={fromDate || todayISO}
                  onChange={(val) => setToDate(val)}
                />
              </div>
            </>
          ) : null}
          {makeType === "approximateTime" ? (
            <label>
              <span>{copy.selectMonth}</span>
              <input
                name="month"
                required
                type="month"
                aria-label={copy.selectExpectedMonth}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
              />
            </label>
          ) : null}
          {makeType === "notSureYet" ? <label><span>{copy.manyDays}</span><input min="1" name="days" required type="number" placeholder={copy.manyDays} /></label> : null}
          <button className="btn-primary" type="submit">{copy.makeTripShort}</button>
        </div>
      ) : null}
      {mode === "find" ? <>
        <div className="home-search-fields">
          <label>
            <span>{copy.where}?</span>
            <SearchSelectDropdown
              name="place"
              value={findValues.destination}
              placeholder={copy.choosePlace}
              iconType="location"
              menuTitle={copy.where ? `${copy.where}?` : "Egypt Destinations"}
              required
              options={destinations.map((destination) => ({
                value: String(destination.slug || destination.id),
                label: String(destination.title || destination.name),
              }))}
              onChange={(value) => applyVoiceValues({ destination: value })}
            />
          </label>
          <label>
            <span>{copy.howLong}?</span>
            <SearchSelectDropdown
              name="duration"
              value={findValues.duration}
              placeholder={copy.chooseDuration}
              iconType="duration"
              menuTitle={copy.howLong ? `${copy.howLong}?` : "Trip Duration (Days)"}
              required
              options={Array.from({ length: 45 }, (_, index) => ({
                value: String(index + 1),
                label: String(index + 1),
              }))}
              onChange={(value) => applyVoiceValues({ duration: value })}
            />
          </label>
          <button className="btn-primary" type="submit">{copy.search}</button>
        </div>
        <VoiceFindTripPanel key={locale} locale={locale} destinations={destinations} rootCategories={rootCategories} values={{ ...findValues, category: reviewedCategory }} onApply={applyVoiceValues} />
      </> : null}
      {mode === "car" ? (
        <div className="home-search-fields home-search-car-fields">
          <fieldset aria-label={copy.tripType} role="radiogroup">
            <span className="home-search-question">{copy.tripType}</span>
            <label>
              <input checked={carType === "oneWay"} name="carType" onChange={() => setCarType("oneWay")} type="radio" value="oneWay" /> {copy.oneWay}
            </label>
            <label>
              <input checked={carType === "roundTrip"} name="carType" onChange={() => setCarType("roundTrip")} type="radio" value="roundTrip" /> {copy.roundTrip}
            </label>
          </fieldset>
          <label>
            <span>{copy.carHolder}</span>
            <SearchSelectDropdown
              name="location"
              placeholder={copy.choosePickup}
              iconType="location"
              menuTitle={copy.carHolder || "Pick-Up Location"}
              required
              options={locations.map((location) => ({
                value: String(location.id),
                label: String(location.name),
              }))}
              onChange={(value) => loadDropLocations(value)}
            />
          </label>
          <label>
            <span>{copy.dropoff}</span>
            <SearchSelectDropdown
              name="dropLocation"
              placeholder={loadingLocations ? "Loading..." : copy.chooseDropoff}
              iconType="location"
              menuTitle={copy.dropoff || "Drop-Off Location"}
              required
              disabled={loadingLocations || dropLocations.length === 0}
              options={dropLocations.map((location) => ({
                value: String(location.id),
                label: String(location.name),
              }))}
            />
          </label>
          <div className="home-search-field-col">
            <span className="home-search-field-label">{copy.pickupDate}</span>
            <FlowbiteDatepicker
              name="pickupDate"
              placeholder={copy.choosePickupDate}
              enableTime={true}
              minDate={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          {carType === "roundTrip" ? (
            <div className="home-search-field-col">
              <span className="home-search-field-label">{copy.returnDate}</span>
              <FlowbiteDatepicker
                name="returnDate"
                placeholder={copy.chooseReturnDate}
                enableTime={true}
                minDate={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          ) : null}
          <button className="btn-primary" type="submit">{copy.sendRequest}</button>
          {locationsFailed ? <p role="alert">Locations are temporarily unavailable. Please try again.</p> : null}
        </div>
      ) : null}
    </form>
  );
}
